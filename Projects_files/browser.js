var DataSourceTree = function(options) {
	this._data 	= options.data;
	this._url = options.url;
	this._container = options.container;
}

DataSourceTree.prototype.data = function(options, callback) {
	var self = this;
	var $data = null;
	if(!("name" in options) && !("type" in options)){
		if (!this._data && this._url) {
			var con = this._container;
			$.ajax(this._url, {
				type: "GET",
				dataType: "json",
				success: function (response) {
					if (response) {
						if (con) {
							$(con).removeClass("hidden");
						}
						callback({ data: response });
						return;
					} else {
						if (con) {
							$(con).addClass("hidden");
						}
					}
				}
			});
		} else {
			$data = this._data;//the root tree
			callback({ data: $data });
			return;
		}
	}
	else if("type" in options && options.type == "folder") {
		if("additionalParameters" in options && "children" in options.additionalParameters)
			$data = options.additionalParameters.children;
		else $data = {}//no data
	}
	if($data != null)//this setTimeout is only for mimicking some random delay
		setTimeout(function(){callback({ data: $data });} , parseInt(Math.random() * 500) + 200);

};
