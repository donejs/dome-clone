const {serializeToString} = require("./serialize");

function makePrependTo(prop) {
	return function(document, element) {
		if(!document[prop]) {
			return;
		}
		let fc = document[prop].firstChild;
		if(fc) {
			document[prop].insertBefore(element, fc);
		} else {
			document[prop].appendChild(element);
		}
	};
}

function firstOfKind(root, nodeName) {
	if (root == null) {
		return null;
	}

	var node = root.firstChild;
	while (node) {
		if (node.nodeName === nodeName) {
			return node;
		}
		node = node.nextSibling;
	}
	return null;
}

function setNodeValue(node, value) {
	node.nodeValue = node.data = value;
}

function removeInlineScripts(root) {
	let scripts = root.getElementsByTagName("script");
	for(let el of scripts) {
		el.removeAttribute("src");
		if(el.firstChild) {
			setNodeValue(el.firstChild, "");
		}
		el.setAttribute("data-noop", "");
	}
}

const prependToHead = makePrependTo("head");
const prependToBody = makePrependTo("body");

function applyLock(document, prop, node) {
	// If the documentElement is replaced (done-autorender),
	// move the script over to the new <head> element.
	let rc = document.replaceChild;
	document.replaceChild = function(){
		let res = rc.apply(this, arguments);
		if(prop === "head") {
			prependToHead(document, node);
		} else if(prop === "body") {
			prependToBody(document, node);
		}
		return res;
	};
}

class SyncedDocuments {
	constructor(document) {
		this.realDocument = document;
		this.hasDocType = document.firstChild.nodeType === 10;

		// This should probably use document.implementation
		// But this would be a breaking change.
		this.clone = document.documentElement.cloneNode(true);
		this.cloneDoc = {
			head: firstOfKind(this.clone, "HEAD"),
			body: firstOfKind(this.clone, "BODY")
		};
	}

	prependToCloneHead(node) {
		prependToHead(this.cloneDoc, node);
	}

	prependToCloneBody(node) {
		prependToBody(this.cloneDoc, node);
	}

	prependToHead(node, otherNode, lock) {
		prependToHead(this.realDocument, node);
		prependToHead(this.cloneDoc, otherNode);

		if(lock) {
			applyLock(this.realDocument, "head", node);
		}
	}

	prependToBody(node, otherNode, lock) {
		prependToBody(this.realDocument, node);
		if(otherNode) {
			prependToBody(this.cloneDoc, otherNode);
		}
		if(lock) {
			applyLock(this.realDocument, "body", node);
		}
	}

	appendToBody(node, otherNode) {
		this.realDocument.body.appendChild(node);
		this.cloneDoc.body.appendChild(otherNode);
	}

	replaceInHead(callback) {
		let head = this.realDocument.head;
		let el = head.firstChild;
		while(el) {
			let newEl = callback(el);
			if(newEl) {
				head.insertBefore(newEl, el);
				head.removeChild(el);
			}
			el = el.nextSibling;
		}
	}

	toIframe() {
		let hasDocType = this.hasDocType;
		let iframe = this.realDocument.createElement("iframe");
		iframe.setAttribute("id", "donessr-iframe");
		iframe.setAttribute("data-keep", "");
		let srcdoc = (hasDocType ? "<!doctype html>" : "") +
			serializeToString(this.clone);
		iframe.setAttribute("srcdoc", srcdoc);
		iframe.setAttribute("style", "border:0;position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;visibility:visible;");
		return iframe;
	}
}

exports.injectFrame = function(document, options = {}) {
	if(!options.reattachScript) {
		throw new Error("options.reattachScript is a required value.");
	}

	if(!options.streamUrl) {
		throw new Error("options.streamUrl is a required value");
	}

	let syncer = new SyncedDocuments(document);

	// Remove any inline scripts
	removeInlineScripts(syncer.clone);

	let reattachScript = document.createElement("script");
	reattachScript.setAttribute("type", "module");
	reattachScript.appendChild(document.createTextNode(options.reattachScript));

	let closeScript = document.createElement("script");
	closeScript.textContent = `window.closeSsrIframe=function(){var d=document;var f=d.getElementById("donessr-iframe");f.parentNode.removeChild(f);d.body.style.visibility = ''}`;
	syncer.prependToHead(
		closeScript,
		reattachScript,
		true
	);

	if(options.preload) {
		let link = document.createElement("link");
		link.setAttribute("rel", "preload");
		link.setAttribute("as", "fetch");
		link.setAttribute("crossorigin", "anonymous");
		link.setAttribute("href", options.streamUrl);

		syncer.prependToHead(
			document.createComment("autorender-keep preload placeholder"),
			link,
			true
		);
	}

	syncer.clone.setAttribute("data-streamurl", options.streamUrl);

	// Move links to the bottom of the body
	let appends = [];
	syncer.replaceInHead(el => {
		if(el.nodeName === "LINK" && el.getAttribute("rel") === "stylesheet") {
			appends.push(el);
			return document.createComment("autorender-keep stylesheet");
		}
	});

	for(let el of appends) {
		syncer.appendToBody(
			el, document.createComment("stylesheet")
		);
	}

	// Iframe
	syncer.prependToCloneBody(document.createComment("iframe placeholder"));
	let iframe = syncer.toIframe();
	syncer.prependToBody(iframe, null, true);

	// Final stuff
	document.body.setAttribute("style", "visibility: hidden;");
	document.documentElement.setAttribute("data-incrementally-rendered", "");
};
