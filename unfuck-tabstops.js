javascript:(function(){
"use strict";

/**
 * @file Source for a bookmarklet I run before bothering to read most
 * JavaScript on GitHub. Replaces 2-space tabstops with tabs rendered
 * at 4 columns.
 */


/**
 * Retrieve every text-node contained by a DOM element.
 *
 * @param {Element} el
 *    Element to recursively scan for text-nodes.
 *
 * @param {String} [filter]
 *    CSS selector to skip nodes of unwanted elements.
 *
 * @example collectTextNodes(el, "#ignore > .this");
 * @return {CharacterData[]}
 */
function collectTextNodes(el, filter = ""){
	const nodes = [];
	for(const node of el.childNodes)
		switch(node.nodeType){
			case Node.TEXT_NODE:
				nodes.push(node);
				break;
			case Node.ELEMENT_NODE:
				if(!filter || !node.matches(filter))
					nodes.push(...collectTextNodes(node));
		}
	return nodes;
}


/**
 * Replace soft-tabs with the superior/logical alternative.
 *
 * @param {String} [selector]
 * @param {Number} [width=2]
 * @main
 */
function unfuckTabstops(selector, width = 2){
	const regexp = new RegExp(`(^|\\n)((?:${" ".repeat(width)})+)`, "g");
	for(const block of document.querySelectorAll(selector)){
		for(const node of collectTextNodes(block)){
			const {data} = node;
			const fixed = data.replace(regexp, (_, nl, crap) => {
				return nl + "\t".repeat(crap.length / width);
			});
			if(fixed !== data)
				node.data = fixed;
		}
	}
}

const selector = [
	".highlight > pre",
	"table.highlight td.blob-num + .blob-code",
	"pre > code",
];
if(document.contentType === "text/plain")
	selector.push("body, body *");

unfuckTabstops(selector.join(", "));
})();
