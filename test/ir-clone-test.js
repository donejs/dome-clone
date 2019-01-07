var QUnit = require("steal-qunit");
var cloneUtils = require("../ir-clone");

function createDocument() {
	return document.implementation.createHTMLDocument("test");
}

QUnit.test("Clones consecutive text nodes", function() {
	var doc = createDocument();
	var h1 = doc.createElement("h1");
	h1.setAttribute("class", "header");
	doc.body.appendChild(h1);

	var i = 0;
	while(i < 5) {
		var txt = doc.createTextNode(""+i);
		h1.appendChild(txt);
		i++;
	}

	var html = cloneUtils.serializeToString(doc);

	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body><h1 class=\"header\">0<!--__DONEJS-SEP__-->1<!--__DONEJS-SEP__-->2<!--__DONEJS-SEP__-->3<!--__DONEJS-SEP__-->4</h1></body></html>";
	QUnit.equal(html, expected);
});

QUnit.test("Document with comments", function() {
	var doc = createDocument();
	doc.body.appendChild(doc.createComment("some comment"));
	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body><!--some comment--></body></html>";
	QUnit.equal(html, expected);
});

QUnit.test("Doesn't include comment unless there are consecutive text nodes", function() {
	var doc = createDocument();
	doc.body.appendChild(doc.createTextNode("test"));
	doc.body.appendChild(doc.createElement("h1"));
	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body>test<h1></h1></body></html>";
	QUnit.equal(html, expected);
});

QUnit.test("TextNodes in between elements", function() {
	var doc = createDocument();
	doc.body.appendChild(doc.createTextNode("1"));
	var h1 = doc.createElement("h1");
	h1.appendChild(doc.createTextNode(2));
	doc.body.appendChild(h1);

	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body>1<h1>2</h1></body></html>";
	QUnit.equal(html, expected);
});

QUnit.test("Escapes attributes", function() {
	var doc = createDocument();
	var iframe = doc.createElement("iframe");
	var srcdoc = "<html><head><title>Some title</title></head><body class=\"open\"><h1>Hello world</h1></body></html>";
	iframe.setAttribute("srcdoc", srcdoc);
	doc.body.appendChild(iframe);

	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body><iframe srcdoc=\"<html><head><title>Some title</title></head><body class=&quot;open&quot;><h1>Hello world</h1></body></html>\"></iframe></body></html>";
	QUnit.equal(html, expected);
});

QUnit.test("Does not close void elements", function() {
	var doc = createDocument();
	doc.head.appendChild(doc.createElement("meta"));
	doc.head.appendChild(doc.createElement("link"));
	doc.body.appendChild(doc.createElement("div"));
	doc.body.appendChild(doc.createElement("input"));

	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title><meta><link></head><body><div></div><input></body></html>";
	QUnit.equal(html, expected);
});

QUnit.test("Empty TextNodes are given space", function() {
	var doc = createDocument();

	doc.body.appendChild(doc.createTextNode(""));
	doc.body.appendChild(doc.createTextNode(""));
	doc.body.appendChild(doc.createTextNode(""));

	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body> <!--__DONEJS-SEP__--> <!--__DONEJS-SEP__--> </body></html>";
	QUnit.equal(html, expected);
});


QUnit.test("Script tags with an empty TextNode are not given space", function() {
	var doc = createDocument();
	var script = doc.createElement("script");
	script.appendChild(doc.createTextNode(""));
	doc.body.appendChild(script);

	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body><script></script></body></html>";
	QUnit.equal(html, expected);
});

QUnit.test("Prefer TextNode::data over nodeValue", function() {
	var doc = createDocument();
	var tn = doc.createTextNode("value");
	Object.defineProperty(tn, "nodeValue", {
		value: undefined
	});
	doc.body.appendChild(tn);

	var html = cloneUtils.serializeToString(doc);
	var expected = "<!DOCTYPE html><html><head><title>test</title></head><body>value</body></html>";
	QUnit.equal(html, expected);
});
