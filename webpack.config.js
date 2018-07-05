// 引入操作路径模块和webpack 
var path = require('path');
var webpack = require('webpack');

const fs = require('fs');
const crypto = require('crypto');

var CleanWebpackPlugin = require('clean-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin'); //抽离css
var htmlWebpackPlugin = require('html-webpack-plugin');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var HashedChunkIdsPlugin = require('./webpack-config/hashedChunkIdsPlugin.js');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

const HappyPack = require('happypack');
const os = require('os');
const HappyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length});

//生产与开发环境配置
var glob = require('glob');
var prod = process.env.NODE_ENV === 'production' ? true : false; //是否是生产环境
var isPc = process.env.PLATFORM == 'pc' ? true : false; //是否是pc编译

//webpack配置
var eslintConfigDir = prod ? './webpack-config/.eslintrc.js' : './webpack-config/.eslintrc.dev.js';
var postcssConfigDir = './webpack-config/postcss.config.js';
var resolveConfigDir = './webpack-config/resolve.config.js';

//忽略不必要编译的文件
var entryIgnore = require('./entryignore.json');

//console.log('entryignore:', entryIgnore);

if(isPc){
	//pc版目录配置
	console.log('***********************PC编译*************************');
	
	var baseEntryDir = './static/src/pc/';
	var entryDir = baseEntryDir + '**/*.js';
	var outDir = path.resolve(__dirname, './static/dist/pc');
	var outPublicDir = 'http://static.naus.io/dist/pc/';
	var basePageDir = 'html/pc';
	var basePageEntry = './'+basePageDir+'/';
	var browserSyncBaseDir = './'+basePageDir+'/dist';
	//clean folder
	var cleanFolder = [
		//path.resolve(__dirname, './html/pc/dist'), 
		'js',
		'css'
	];
	var cleanOptions = {
		root: path.resolve(__dirname, './static/dist/pc'),
		exclude: [
			'lib'
		]
	}

	var dll_manifest_name = 'dll_pc';
	var vendor_manifest_name = 'vendor_pc';
}else{
	//触屏版目录配置
	console.log('***********************触屏版编译*************************');

	var baseEntryDir = './static/src/mobile/';
	var entryDir = baseEntryDir + '**/*.js';
	var outDir = path.resolve(__dirname, './static/dist/mobile');
	var outPublicDir = 'http://static.naus.io/dist/mobile/';
	var basePageDir = 'html/mobile';
	var basePageEntry = './'+basePageDir+'/';
	var browserSyncBaseDir = './'+basePageDir+'/dist';
	//clean folder
	var cleanFolder = [
		//path.resolve(__dirname, './html/mobile/dist'), 
		'js',
		'css'
	];
	var cleanOptions = {
		root: path.resolve(__dirname, './static/dist/mobile'),
		exclude: [
			'lib'
		]
	}

	var dll_manifest_name = 'dll';
	var vendor_manifest_name = 'vendor';
}


//入口js文件配置以及公共模块配置
var entries = getEntry(entryDir); 
entries.manifest = ['guide'];

module.exports = {
	cache: true,
    /* 输入文件 */
	resolve: require( resolveConfigDir ),
	entry: entries,
	output: {
		path: outDir,
		publicPath: outPublicDir,
		filename: 'js/[name].[chunkhash:8].js',
		chunkFilename: 'js/[name]-chunk.[chunkhash:8].js'
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					postcss: [require( postcssConfigDir )]
				}
			},
			{
				test: /\.ejs$/,
				/*loader: 'ejs-loader'*/
				use: 'happypack/loader?id=ejs'
			},
			{
				test: /\.js$/,
				enforce: 'pre',
				include: path.resolve(__dirname, entryDir),
				exclude: [baseEntryDir + 'js/lib', baseEntryDir + 'js/component'],
				use: 'happypack/loader?id=js',
				//loader: 'eslint-loader',
				/*options: {
					fix: true
				}*/
			},
			{
				test: /\.js$/,
				use: 'happypack/loader?id=babel',
				//loader: 'babel-loader?cacheDirectory=true',
        		exclude: ['node_modules', baseEntryDir + 'js/lib', baseEntryDir + 'js/component']
			},
			{   
        		test: /\.css$/, 
				use: ['style-loader', 'css-loader', 'postcss-loader'],
				exclude: [baseEntryDir + 'css/lib']
			},
			{
				test: /\.less$/,
				use: ExtractTextPlugin.extract(['css-loader','postcss-loader','less-loader']),
			},
			{
				test: /\.(png|jpg|gif)$/,
				loader: 'url-loader',
				options: {
					limit: 5120,
					name: function(p){
						let tem_path = p.split(/\\img\\/)[1];
						tem_path = tem_path.replace(/\\/g,'/');

						return 'img/'+tem_path + '?v=[hash:8]';
					}
				}
			},
			{
				test: /\.html$/,
				use: [ {
					loader: 'html-loader',
					options: {
						minimize: true
					}
				}],
			}
		]
	},
	plugins: [
		new HappyPack({
			id: 'ejs',
			threadPool: HappyThreadPool,
			loaders: ['ejs-loader']
		}),
		new HappyPack({
			id: 'js',
			threadPool: HappyThreadPool,
			loaders: [{
				loader: 'eslint-loader',
				options: {
					fix: true
				}
			}]
		}),
		new HappyPack({
			id: 'babel',
			threadPool: HappyThreadPool,
			loaders: ['babel-loader?cacheDirectory=true']
		}),
		new ExtractTextPlugin('css/[name].[contenthash:8].css'),
		new webpack.HashedModuleIdsPlugin(),
		new HashedChunkIdsPlugin(),
		new webpack.DllReferencePlugin({
		  // 指定一个路径作为上下文环境，需要与DllPlugin的context参数保持一致，建议统一设置为项目根目录
		  context: __dirname, 
		  manifest: require('./manifest/'+ dll_manifest_name +'_manifest.json'),
		  // 当前Dll的所有内容都会存放在这个参数指定变量名的一个全局变量下，注意与DllPlugin的name参数保持一致
		  name: 'dll_library',
		}),
		new webpack.DllReferencePlugin({
		  context: __dirname,
		  manifest: require('./manifest/'+ vendor_manifest_name +'_manifest.json'),
		  name: 'vendor_library', 
		}),
		new BrowserSyncPlugin({
			host: 'm.tuho.tv',
			port: 3000,
			server: { baseDir: [browserSyncBaseDir] }
		}),
		new webpack.LoaderOptionsPlugin({
			options: {
				eslint: require( eslintConfigDir ),
				postcss: require( postcssConfigDir )
			},
		}),

    	// 提取公共模块
		new webpack.optimize.CommonsChunkPlugin({
			names:  ['manifest'], // 公共模块的名称
      		//filename: 'js/vendors-[hash:6].js', // 公共模块的名称
			chunks: 'manifest',  // chunks是需要提取的模块
			minChunks: Infinity  //公共模块最小被引用的次数
		}),
		/*new CopyWebpackPlugin([
            { from: baseEntryDir + 'js/lib', to: 'js/lib' },
		]),*/
		new HtmlWebpackIncludeAssetsPlugin({
			assets: [getLatestFile('js/lib/dll.js')],
			append: false
		}),
		new HtmlWebpackIncludeAssetsPlugin({
			assets: [getLatestFile('js/lib/vendor.js')],
			append: false
		}),
		new HtmlWebpackIncludeAssetsPlugin({
			assets: [getLatestFile('css/lib/vendor.css')],
			append: false
		})
	]
};

function getLatestFile(path){
	let new_path = path.replace(/\./g, '.**.');
	let latest_file = '';
	let latest_file_mtime = 0;

	glob.sync(outDir + '/' + new_path).forEach(function(file){
		let fileInfo = fs.statSync(file);
		let file_mtime = +new Date(fileInfo.mtime);

		latest_file = file_mtime > latest_file_mtime ? file : latest_file;
		latest_file_mtime = file_mtime > latest_file_mtime ? file_mtime : latest_file_mtime;

	})

	return latest_file.replace(/^.*\/(js\/|css\/)/ig, "$1");
}


/***** 生成组合后的html *****/

var pages = getEntry(basePageEntry + 'src/**/*.ejs');
for (var pathname in pages) {

	var conf = {
		filename: path.resolve(__dirname, basePageEntry + 'dist/' + pathname + '.html'), // html文件输出路径
		template: path.resolve(__dirname, basePageEntry + 'src/'+ pathname + '.js'),
		inject: true, 
		cache: true, //只改动变动的文件
		//hash: true,
		minify: {
			removeComments: true,
			collapseWhitespace: false
		}
	};

	if (pathname in module.exports.entry) {
		conf.chunks = [pathname, 'manifest'];
	}else{
		conf.chunks = ['manifest'];
	}	

	module.exports.plugins.push(new htmlWebpackPlugin(conf));
}




/***** 获取文件列表(仅支持js和ejs文件)：输出正确的js和html路径 *****/

function getEntry(globPath) {
	var entries = {}, basename;

	glob.sync(globPath).forEach(function (entry) {

    	//排出layouts内的公共文件
		if(entry.indexOf('layouts') == -1 && entry.indexOf('lib') == -1 && entry.indexOf('component') == -1){

			//判断是js文件还是ejs模板文件
			let isJsFile = entry.indexOf('.js') !== -1;
			let dirArr = isJsFile ? 
						entry.split('/js/')[1].split('.js')[0].split('/') :
						entry.split(basePageDir+'/src/')[1].split('.ejs')[0].split('/');
			
			basename = dirArr.join('/');

			if(entryIgnore.indexOf(basename) == -1){
				entries[basename] = entry;
			}

		}
	});

	//console.log(entries);
	
	return entries;
}


const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

/***** 区分开发环境和生产环境 *****/

if (prod) {
	console.log('当前编译环境：production');

	//module.exports.devtool = 'module-cheap-source-map'
	module.exports.plugins = module.exports.plugins.concat([
		new CleanWebpackPlugin(cleanFolder, cleanOptions ),
    	//压缩css代码
		new OptimizeCssAssetsPlugin({
			assetNameRegExp: /\.css\.*(?!.*map)/g,  //注意不要写成 /\.css$/g
			cssProcessor: require('cssnano'),
			cssProcessorOptions: { 
				discardComments: {removeAll: true },
				// 避免 cssnano 重新计算 z-index
 				safe: true
			},
			canPrint: true
		}),
 		//压缩JS代码
		new UglifyJsPlugin({
			cache: true,
			parallel: true,
		    uglifyOptions: {
		      ie8: false,
		      ecma: 8,
		      output: {
		        comments: false,
		        beautify: false,
		      },
		      compress: true,
		      warnings: false
		    }
		  })

	]);
} else {  
	console.log('当前编译环境：dev');

	module.exports.devtool = 'cheap-module-source-map';
}