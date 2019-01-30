
var QUnit = require("steal-qunit");
var cloneUtils = require("../ir-clone");

function createDocument() {
	return document.implementation.createHTMLDocument("test");
}

QUnit.module("injectFrame");

QUnit.test("Injects the frame", function(assert) {
	let doc = createDocument();
	cloneUtils.injectFrame(doc, {
		reattachScript: "console.log('hello world');",
		streamUrl: "http://example.com/instr",
		preload: true
	});

	assert.equal(doc.body.firstChild.id, "donessr-iframe", "iframe inserted as first item");
	assert.equal(doc.head.firstChild.nodeType, 8, "iframe placeholder");
	assert.equal(doc.head.firstChild.nextSibling.nodeName, "SCRIPT", "close script is next");
});

QUnit.test("Injected items remain in their spot when the documentElement is replaced", function(assert){
	let doc = createDocument();
	cloneUtils.injectFrame(doc, {
		reattachScript: "console.log('hello world');",
		streamUrl: "http://example.com/instr",
		preload: true
	});

	let newDocEl = doc.createElement("html");
	newDocEl.appendChild(doc.createElement("head"));
	newDocEl.appendChild(doc.createElement("body"));

	doc.replaceChild(newDocEl, doc.documentElement);

	assert.equal(doc.body.firstChild.id, "donessr-iframe", "iframe inserted as first item");
	assert.equal(doc.head.firstChild.nodeType, 8, "iframe placeholder");
	assert.equal(doc.head.firstChild.nextSibling.nodeName, "SCRIPT", "close script is next");
});

QUnit.test("Body set to visibility:hidden", function(assert) {
	let doc = createDocument();
	cloneUtils.injectFrame(doc, {
		reattachScript: "console.log('hello world');",
		streamUrl: "http://example.com/instr",
		preload: true
	});

	assert.equal(doc.body.style.visibility, "hidden");
});

QUnit.test("data-incrementally-rendered attr added", function(assert) {
	let doc = createDocument();
	cloneUtils.injectFrame(doc, {
		reattachScript: "console.log('hello world');",
		streamUrl: "http://example.com/instr",
		preload: true
	});

	assert.equal(doc.documentElement.dataset.incrementallyRendered, "");
});

QUnit.test("Blocking link tags are moved to the bottom of the body", function(assert) {
	let doc = createDocument();
	
	let link = doc.createElement("link");
	link.rel = "stylesheet";
	link.href = "http://example.com/foo.css";
	doc.head.appendChild(link);

	cloneUtils.injectFrame(doc, {
		reattachScript: "console.log('hello world');",
		streamUrl: "http://example.com/instr",
		preload: true
	});

	let last = doc.head.lastChild;
	assert.notEqual(last.nodeName, "LINK", "link not in the head");
	assert.equal(doc.body.lastChild.nodeName, "LINK", "link is now in the body");
});
