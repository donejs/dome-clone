var voidMap = require("./void-map");

var REG_ESCAPE_ALL = /[<>&]/g;
var REG_ESCAPE_PRESERVE_ENTITIES = /[<>]|&(?:#?[a-zA-Z0-9]+;)?/g;

var metadataContentTags = {
    style: true,
    script: true,
    template: true
};

function* serialize(rootNode) {
	var node = rootNode;
	var prev = node;

	// This depth value will be incremented as the depth increases and
	// decremented as the depth decreases. The depth of the initial node is 0.
	var depth = 0;
	var skip = false;

	do {
		if(!skip) {
			switch(node.nodeType) {
				// Element
				case 1:
					yield "<" + node.nodeName.toLowerCase();
					for(var i = 0, len = node.attributes.length; i < len; i++) {
						var attr = node.attributes[i];
						if(attr.value) {
							if (attr.name === 'href' || attr.name === 'src') {
								yield ` ${attr.name}="${attr.value}"`;
							}
							// Not sure if this is right, can-simple-dom doesn't do this.
							else if(attr.name === 'srcdoc') {
								yield ` ${attr.name}="${escapeAttributeValue(attr.value)}"`;
							} else {
								yield ` ${attr.name}="${escapeAttributeValue(attr.value)}"`;
							}
						} else {
							yield " " + attr.name;
						}
					}
					yield ">";

					if(!node.firstChild && node.nodeType === 1 && !isVoid(node)) {
						yield "</" + node.nodeName.toLowerCase() + ">";
					}
					break;
				// TextNode
				case 3:
					if(prev && prev.nodeType === 3) {
						yield "<!--__DONEJS-SEP__-->";
					}

					if (isMetadataTag(node.parentNode)) {
						yield giveSpace(node.nodeValue);
					} else {
						yield giveSpace(escapeText(node.nodeValue));
					}
					break;
				// Comments
				case 8:
					yield `<!--${node.nodeValue}-->`;
					break;
				// Doctype node
				case 10:
					yield `<!DOCTYPE ${node.name}>`;
					break;
			}
		}

		if(!skip && node.firstChild) {
			depth++;
			prev = node;
			node = node.firstChild;
		} else if(node.nextSibling) {
			prev = node;
			node = node.nextSibling;
			skip = false;
		} else {
			node = node.parentNode;
			depth--;
			skip = true;

			if(node.nodeType === 1 && !isVoid(node)) {
				yield "</" + node.nodeName.toLowerCase() + ">";
			}
		}
	} while ( depth > 0 );
}

function serializeToString(rootNode) {
	var html = "";
	for(var chunk of serialize(rootNode)) {
		html += chunk;
	}
	return html;
}

function escapeAttributeValue(value) {
	return value.replace(/"|&(?:#?[a-zA-Z0-9]+;)?/g, function(match) {
		switch(match) {
			case '&':
				return '&amp;';
			case '\"':
				return '&quot;';
			default:
				return match;
		}
	});
}

function escapeText(value, escapeAll) {
	return value.replace(escapeAll ? REG_ESCAPE_ALL : REG_ESCAPE_PRESERVE_ENTITIES, function(match) {
		switch(match) {
			case '&':
				return '&amp;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			default:
				return match;
		}
	});
}

function isMetadataTag (elem) {
	return !!elem && metadataContentTags[elem.nodeName.toLowerCase()];
}

function isVoid(element) {
	return voidMap[element.nodeName] === true;
}

function giveSpace(txt) {
	if(txt.length) {
		return txt;
	}
	return " ";
}

exports.serialize = serialize;
exports.serializeToString = serializeToString;
