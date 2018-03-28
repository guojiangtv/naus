// 防止错误中断gulp任务，并且报错时notify通知
var notify = require('gulp-notify')

module.exports = function(errorObject, callback) {
	//console.log('errorObject:'+errorObject)
	notify.onError(errorObject.toString().split(': ').join(':\n')).apply(this, arguments)

    // 防止gulp进程挂掉
	if (typeof this.emit === 'function') {
		this.emit('end')
	}
}