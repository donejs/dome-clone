
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
						yield ` ${node.attributes[i].name}="${node.attributes[i].value}"`;
					}
					yield ">";

					if(!node.firstChild && node.nodeType === 1) {
						yield "</" + node.nodeName.toLowerCase() + ">";
					}
					break;
				// TextNode
				case 3:
					if(prev && prev.nodeType === 3) {
						yield "<!--__DONEJS-SEP__-->";
					}

					yield node.nodeValue;
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
			node = node.firstChild;
		} else if(node.nextSibling) {
			prev = node;
			node = node.nextSibling;
			skip = false;
		} else {
			node = node.parentNode;
			depth--;
			skip = true;

			if(node.nodeType === 1) {
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

exports.serialize = serialize;
exports.serializeToString = serializeToString;
