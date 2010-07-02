/**
*  
*  Base64 encode / decode
*  Based off of http://www.webtoolkit.info/javascript-base64.html
*
**/
 
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
		    chr1 = input.charCodeAt(i++);
		    chr2 = input.charCodeAt(i++);
		    chr3 = input.charCodeAt(i++);
		    output += this._bytes2chars(chr1,chr2,chr3);
		}
 
		return output;
	},
	// private method changing integers to chars
        _bytes2chars : function(chr1,chr2,chr3) {
	    enc1 = chr1 >> 2;
	    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
	    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	    enc4 = chr3 & 63;
	    
	    if (isNaN(chr2)) {
		enc3 = enc4 = 64;
	    } else if (isNaN(chr3)) {
		enc4 = 64;
	    }
 
	    return (this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
		    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4));
	},
        _chars2bytes : function(chars4) {
	    enc1 = this._keyStr.indexOf(chars4.charAt(0));
	    enc2 = this._keyStr.indexOf(chars4.charAt(1));
	    enc3 = this._keyStr.indexOf(chars4.charAt(2));
	    enc4 = this._keyStr.indexOf(chars4.charAt(3));

	    chr1 = (enc1 << 2) | (enc2 >> 4);
	    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
	    chr3 = ((enc3 & 3) << 6) | enc4;
	    var rv = [chr1];
	    if (enc3 != 64) rv.push(chr2)
	    if (enc4 != 64) rv.push(chr3)
	    return rv
	},
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
	    input = input.replace(RegExp('[^'+this._keyStr+']','g'), "");
 
		while (i < input.length) {
		    var chr=this._chars2bytes(input.substr(i,4));
		    i+=4;
		    for (var j=0;j<chr.length;j++) {
			output = output + String.fromCharCode(chr[j]);
		    }
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	}
 
}