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
	    try {
		self.msg(i,self.tests[i](),false)
	    } catch(e) {
		self.msg(i,e.message,true)
	    }
	}
    }
    this.ok = function(i) {}
    this.fail = function(i,msg) {}
    this.msg = function(i,msg,fail) {
	var li = document.createElement('li')
	testdom.appendChild(li)
	li.innerHTML = i+' '+(msg||'')
	li.style.backgroundColor = ((fail)?'red':'green')
    }
    function assert(true_v, msg) {
	if (!true_v) throw Error("Failed on: "+msg)
    }
    this.vars = {
	key1_alias:'key1_alias'
    }
    this.tests = [
	/// #1   -*create key1
	function create_key1() {
	    var frm= document.forms['generatekey']
	    frm.elements['alias'].value = self.vars.key1_alias
	    frm.submit()

	    //tests:
	    var keys = Stor.keyList()
	    assert(keys.length > 1,'some key exists')
	    var found_key = false,
	        o = document.forms['encrypt'].elements['friendkey'].options
	    for (var i=0;i<keys.length;i++) { 
		console.log(keys[i][2])
		if (keys[i][2] == self.vars.key1_alias) {
		    found_key = true
		    break
		}
	    }
	    assert(found_key, 'key alias is in DB')
	    found_key = false
	    for (var i=0;i<o.length;i++) 
		if (o[i].innerHTML == self.vars.key1_alias) {
		    found_key = true
		    self.vars.key1_secret = o[i].value
		    break
		}
	    assert(found_key, 'key alias is in encrypt form')
	    
	    
	},
	/// #2   -*encrypt message
	function encrypt_msg() {
	    
	}
/// #3   ?decrypt message
/// #4   -*full backup 
/// #5   -*share

/// #6   -delete everything
/// #7   ?restore from full
/// #8      test alias, user
/// #9   ?decrypt message

/// #10  -delete everything
/// #11  -*create key2
/// #12  ?restore from share
/// #13  ?decrypt message
/// #14  -encrypt message2 (with key1)
    ]
})()