/*  KEY: -=action ?=test *=store for later part of test
1   -*create key1
2   -*encrypt message
3   ?decrypt message
4   -*full backup 
5   -*share

6   -delete everything
7   ?restore from full
8      test alias, user
9   ?decrypt message

10  -delete everything
11  -*create key2
12  ?restore from share
13  ?decrypt message
14  -encrypt message2 (with key1)
*/
var Tester = new (function runTests() {
    var self = this,
	testdom = document.getElementById('test')
    this.run = function() {
	for (var i=0;i<self.tests.length;i++) {
	    var name = i+' '+self.tests[i].name;
	    try {
		self.msg(name,self.tests[i](),false)
	    } catch(e) {
		self.msg(name,e.message,true)
	    }
	}
    }
    this.msg = function(name,msg,fail) {
	var li = document.createElement('li')
	testdom.appendChild(li)
	li.innerHTML = name+' '+(msg||'')
	li.style.backgroundColor = ((fail)?'red':'green')
    }
    function assert(true_v, msg) {
	if (!true_v) throw Error("Failed on: "+msg)
    }
    var vv = this.vars = {
	key1_alias:'key1_alias',
	key1_secret:null,
	msg1_plaintext:'Foo and Bar and Hello',
	msg1_encrypted:null,
	msg1_encrypted_uni:null,
	backup_passphrase:'Never lie to your mother',
	backup_string:null,
	shared_string:null
    }
    this.tests = [
	/// #1   -*create key1
	function create_key1() {
	    //setup
	    var frm= document.forms['generatekey']
	    frm.elements['alias'].value = vv.key1_alias
	    Stor.generateKey(frm) //submit

	    //tests
	    var keys = Stor.keyList()
	    assert(keys.length > 1,'some key exists')
	    var found_key = false,
	        o = document.forms['encrypt'].elements['friendkey'].options
	    for (var i=0;i<keys.length;i++) { 
		if (keys[i][2] == vv.key1_alias) {
		    found_key = true
		    break
		}
	    }
	    assert(found_key, 'key alias is in DB')
	    found_key = false
	    for (var i=0;i<o.length;i++) 
		if (o[i].innerHTML == vv.key1_alias) {
		    found_key = true
		    vv.key1_secret = o[i].value
		    break
		}
	    assert(found_key, 'key alias is in encrypt form')
	},
	/// #2   -*encrypt message
	function encrypt_msg() {
	    vv.msg1_encrypted = encrypt_message(vv.msg1_plaintext,'base64',vv.key1_secret)
	    vv.msg1_encrypted_uni = encrypt_message(vv.msg1_plaintext,'unicrap',vv.key1_secret)
	    //self.msg('--plaintext:',vv.msg1_plaintext)
	    //self.msg('--crypt:',vv.msg1_encrypted)
	    var crypted_regex = new RegExp(crypted_regex_str,'g');
	    assert(crypted_regex.test(vv.msg1_encrypted),
	    	   'encrypted message is proper form:'+vv.msg1_encrypted)
	},
	/// #3   ?decrypt message
	function decrypt_msg() {
	    var plain = decrypt_message(vv.msg1_encrypted)
	    assert(plain.length,'decrypted message is non-empty')
	    assert(plain == vv.msg1_plaintext+ '<br />','Decrypted base64 message ==original:')
	    assert(decrypt_message(vv.msg1_encrypted_uni)==vv.msg1_plaintext+'<br />',
		   'Decrypted unicrap message ==original:')
	},
	/// #4   -*full backup 
	function full_backup() {
	    var frm= document.forms['backupform']
	    frm.elements['passphrase'].value = vv.backup_passphrase
	    frm.elements['backup'].value = ''
	    Stor.backupForm(frm)
	    vv.backup_string = frm.elements['backup'].value
	    assert(vv.backup_string.length,'non-empty backup string')
	    document.location = '#test'
	},
	/// #5   -*share
	function share() {
	    var frm= document.forms['shareform']
	    frm.elements['passphrase'].value = vv.backup_passphrase
	    var o = frm.elements['friendkey'].options
	    var selected_key = false
	    for (var i=0;i<o.length;i++) {
		if (o[i].value == vv.key1_secret) {
		    o[i].selected = true
		    selected_key = true
		}
	    }
	    assert(selected_key,'Found and selected key to share')
	    frm.elements['backup'].value = ''
	    Stor.shareForm(frm)
	    vv.share_string = frm.elements['backup'].value
	    assert(vv.share_string.length,'non-empty backup string')
	    document.location = '#test'
	},
	/// #6   -delete everything
	function deleteEverything() {
	    Stor.deleteEverything()
	    assert(Stor.keyList().length==0,'Key list deleted')
	    var fcount=0;
	    for (a in Stor.friendsCache) fcount++
	    assert(fcount==0,'nothing cached')
	},
	/// #7   ?restore from full
	function restoreFromFull() {
	    
	}
/// #8      test alias, user
/// #9   ?decrypt message

/// #10  -delete everything
/// #11  -*create key2
/// #12  ?restore from share
/// #13  ?decrypt message
/// #14  -encrypt message2 (with key1)
    ]
})()