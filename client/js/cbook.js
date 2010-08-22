var crypted_regex_str = String.fromCharCode(9812)+'([.,_])([^<>?&"\']) ([^:<>?&"\']+):([^:<>?&"\']+):?',
regex_args = ['codec','hash','iv','ciphtext'],
html_regex = '<([:\\w]+)[^<]+';

/*
  facebook: document.getElementsByClassName('uiStreamMessage')
  twitter: 
  //document.activeElement to know which element has focus

15chars for IV
1char for addition
4chars for ♔.☿ (could make it 3)
'http://skyb.us/' == 15 chars
140=15+1+4+15+105
*/

var global= {
    FAIL_ENCODING:'Failed to decrypt message, likely due to encoding problems.<br />',
    FAIL_NOKEY:'None of your keys could decrypt this message.<br />'
}
function cryptArgs(iv, encrypt_key_numbers) {
    ///see http://www.josh-davis.org/ecmascrypt
    ///NOTE:if CBC, then we need to save the msgsize
    var mode = 0; //0:OFB,1:CFB,2:CBC
    var keysize = 16; //32 for 256, 24 for 192, 16 for 128
    encrypt_key_numbers = encrypt_key_numbers || ecmaScrypt.toNumbers(global.encrypt_key);
    return [mode, encrypt_key_numbers, keysize, iv];
}
			    
var U2N = new (function() {
    /* we'll need to get a lot smarter.  
       we should be accepting/creating unicode characters within the
       character range that HTML considers 'character' text.
       http://www.w3.org/TR/2000/WD-xml-2e-20000814.html#charsets
       parseInt('10FFFF',16) - parseInt('10000',16) == 1048575
                     1114111 - 65536 ==
       String.fromCharCode(85267) seems to be 'real' first character
     */
    this.min = 61;//131072 = SIP (doesn't seem to work at all) //8239 avoids rtl/ltr codepoints //61 > worst ascii chars
    this.compress = function(low_unicode) {
	var arr = [];
	var c = low_unicode.length;
	while (c--) {
	    arr.unshift(low_unicode.charCodeAt(c));
	}
	return this.unicode(arr);
    }
    this.decompress = function(high_unicode) {
	var nums = this.nums(high_unicode);
	var str = '';
	for (var i=0;i<nums.length;i++) {
	    str += String.fromCharCode(nums[i]);
	}
	return str;
    }
    this.lowcoding = function(cipher) {
	var outhex = '';
	for(var i = 0;i < cipher.length;i++) {
	    outhex += ecmaScrypt.toHex(cipher.charCodeAt(i));
	}
	return outhex;
    }
    this.unicode = function(nums) {
	///take nums array of numbers from 0-255
	var u_string='';
	for (var i=0;i<nums.length;i++) {
	    var n = this.min+( (nums.length-i <= 1 ) ? nums[i] : nums[i] + (256*nums[++i]) );
	    if (n>65535) {
                ///http://en.wikipedia.org/wiki/Mapping_of_Unicode_characters#Planes
		throw Error('cannot deal with high chars yet');
            }
	    if (n>2299099) {
		throw Error('cannot deal with high unicode compression yet');
		//but I think the answer is that we'll have some marker
		//for NON-encoded text and then 
		//
	    } 
	    ///random suspects:
	    if (n==1759 || n==130) {
		throw Error('random suspect--not sure it is culprit');
	    }
	    if (!(n % 256) || !((n+1)%256)) { //2*256 ==512 chars
		//console.warn('U+FFFE and U+FFFF are invalid non-coding on all planes');
		//throw Error('U+FFFE and U+FFFF are invalid non-coding on all planes: '+n);
	    }
	    if (8192 < n && n < 8447) { //255 chars
		///http://en.wikipedia.org/wiki/Unicode_control_characters
		///seem to be grouped all in the 2000 -20FF range
		throw Error('Wide fence for control chars.  we can be more picky'+n);
	    }
	    ///Any code D800–DFFF is invalid: UTF-16 conflict (2047 chars)
	    try {
		var c = String.fromCharCode(n);
		encodeURIComponent(c);
		u_string += c;
	    } catch(e) {
		throw Error('could not encode uri component for char:'+n);
	    }
	    
	}
	if (u_string.match(/\s/)!=null) {
	    throw Error('FAILS BY WHITESPACE');
	}
	return u_string;
    };

    this.nums = function(u_string) {
	var nums = [];
	var m = u_string.length;
	for (var i=0;i<m;i++) {
	    var n = u_string.charCodeAt(i)-this.min;
	    nums.push(n%256);
	    var x2 = parseInt(n/256,10);
	    if (x2 != 0) nums.push(x2);
	}
	return nums;
    };

})();//end U2N

var CBook= {
    chars:{'.':'unicrap',',':'base64'},
    unicrap:{
	chr:'.',
	encrypt:function(iv,ciph,key_numbers) {
	    var compressed = U2N.compress(ciph.cipher);
	    var compressed_IV = U2N.unicode(iv);
	    //cheat on making exceptions and just try decrypt
            var decoded = CBook.unicrap.decrypt(compressed_IV,compressed);
	    decrypt(decoded[0],decoded[1],key_numbers);
	    return [compressed_IV, compressed];
	},
	decrypt:function(iv,ciphtext) {
	    return [U2N.nums(iv), U2N.decompress(ciphtext)];
	}
    },
    base64:{
	chr:',',
	encrypt:function(iv,ciph) {
	    return [Base64.encodeBytes(iv),
		    Base64.encode(ciph.cipher)];
	},
	decrypt:function(iv64,ciphtext) {
	    return [Base64.decodeBytes(iv64),
		    Base64.decode(ciphtext)];
	}
    }
    /*,hex:{
	chr:'_',
	encrypt:function(iv,ciph) {
	    return [ecmaScrypt.toHex(iv), U2N.lowcoding(ciph.cipher)];
	},
	decrypt:function(iv,ciphtext) {
	}
    }*/
};//end CBook

function format_post(codec,hash,iv,ciphertext) {
    var rv = String.fromCharCode(9812)+codec+hash+' '+iv+':'+ciphertext+':';
    //console.log(rv.length);
    return rv;
}

function test_unicode(txt,f) {
    f = f||function(c) {
        return c.match(/([\w\W])/);
    };
    for (var i=0;i<txt.length;i++) {
        var r = f(String.fromCharCode(txt.charCodeAt(i)));
        if (r) {
            console.log('At ('+i+') '+r+' : '+txt.charCodeAt(i));
        }
    }
}
function decrypt_message(crypted) {
    var x;
    var retval = '';
    var crypted_regex = new RegExp(crypted_regex_str,'g');
    while ((x = crypted_regex.exec(crypted)) != null) {
        var friend_keys = Stor.getKeysByIdentifier(x[2]),
            cbook_method = CBook[CBook.chars[x[1]]];
        if (!friend_keys || !friend_keys.length ) {
            retval += global.FAIL_NOKEY;
            continue;
        }
	try {
            var iv_ciph = cbook_method.decrypt(x[3],x[4]);
	}catch(e) {
	    retval += global.FAIL_ENCODING;
            continue;
	}
        var i = friend_keys.length;
        while (i--) {
            try {
                var msg = decrypt(iv_ciph[0],iv_ciph[1],Base64.decodeBytes(friend_keys[i]));
	        retval +=  msg+ '<br />';
                success = true;
                continue;
            } catch(e) {/*probably, just the wrong key, keep trying*/}
        }
        if (!success) retval += global.FAIL_NOKEY;
    }
    return retval;
}
function encrypt_message(plaintext, mode, key_and_ref) {
    mode = mode || 'base64';
    var key_ref = key_and_ref.substr(0,1),
        key = Base64.decodeBytes(key_and_ref.substr(2)),
        tries = 200,
        comp = [];
    if (!key_ref || !key.length) {
	alert("Please choose a key to encrypt with. "
	      +"If you haven't yet, generate a key for yourself.");
	throw Error('no key');
    }
    while (--tries) {
	try {
            comp = CBook[mode].encrypt.apply(null,encrypt(plaintext, key));
	    break;
	} catch(e) {
	    //console.log(e);
	}
    }

    comp.unshift(CBook[mode].chr, key_ref);

    if (tries == 0) {
	throw Error('tried too many times and failed');
    }
    var rv = format_post.apply(null,comp);
    if (window.parent != window && window.postMessage) {
	window.parent.postMessage(rv,"*");
    }
    return rv;
}

function encrypt(plaintext, encrypt_key_numbers) {
    var iv = ecmaScrypt.generateSharedKey(ecmaScrypt.aes.keySize.SIZE_128);
    var crypt_args = cryptArgs(iv, encrypt_key_numbers);
    crypt_args.unshift(plaintext);
    
    return [iv, ecmaScrypt.encrypt.apply(ecmaScrypt,crypt_args), encrypt_key_numbers];
}

function decrypt(iv,ciph_string, encrypt_key_numbers) {
    var crypt_args = cryptArgs(iv, encrypt_key_numbers);
    if (crypt_args[0]==2) 
	throw Error('if CBC, then we need to save the msgsize');
    crypt_args.unshift(ciph_string,0);
    var plaintext = ecmaScrypt.decrypt.apply(ecmaScrypt,crypt_args);
    return plaintext;
}

function update_bookmarklet() {
    var bk = document.getElementById('bookmarklet_source').innerHTML;
    var target = document.getElementById('bookmarklet');
    target.href = 'javascript:('+bk+')("'+String(document.location).split(/[#?]/)[0]+'")';
}

function tryGenuine() {
    /*will try to show genuinity*/
}