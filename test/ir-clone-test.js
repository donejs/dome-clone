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
