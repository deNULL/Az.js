var Az = {
  load: function(url, responseType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = responseType;

    xhr.onload = function (e) {
      if (xhr.response) {
        callback && callback(xhr.response);
      }
    };

    xhr.send(null);
  }
};