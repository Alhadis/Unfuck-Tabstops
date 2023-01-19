(function(preferredSize){
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
	 * Replace non-breaking spaces (U+00A0) with ordinary spaces (U+0020).
	 * @param {String} input
	 * @return {String}
	 */
	function nbspStrip(input){
		return input.replace(/&nbsp;|&#0*160;|&#x0*A0;|\xA0/g, " ");
	}


	/**
	 * Cached regular expressions used for unfucking a specific tabstop size
	 * @const {Object.<Number, RegExp>} cache
	 * @internal
	 */
	const cache = {__proto__: null};


	/**
	 * Replace soft-tabs with the superior/logical alternative.
	 *
	 * @param {String} input
	 * @param {Number} [width=2]
	 * @return {String}
	 * @main
	 */
	function unfuckTabstops(input, width = 2){
		const regexp = cache[width] ||= new RegExp(`(^|\\n)((?:${" ".repeat(width)})+)`, "g");
		return nbspStrip(input).replace(regexp, (_, nl, crap) =>
			nl + "\t".repeat(crap.length / width));
	}

	/**
	 * Guess whether the loaded document is being rendered as plain-text.
	 * @return {Boolean}
	 * @internal
	 */
	function isPlainText(){
		const {body} = document;
		const all = body.querySelectorAll("*");
		const pre = el => !!(/^pre(?:-wrap)?$/i.test(window.getComputedStyle(el).whiteSpace));
		return !body.childElementCount && body.textContent && pre(body)
			|| 1 === all.length && pre(all[0]);
	}


	const selector = [
		".highlight > pre > .line span:first-child:not(:only-child)",
		".prism-code .token-line > .token",
		".react-code-cell",
		".react-code-line-contents",
		"td.blob-num + .blob-code",
		".add-line-comment ~ .blob-code-inner",
		"pre, code, tt",
	];

	if(isPlainText())
		selector.push("body, body *");

	// Name of the CSSOM property used by this browser for CSS's `tab-size` property
	const TAB_SIZE = (n => {
		s = document.documentElement.style;
		if((prop = n[0].toLowerCase() + n.slice(1)) in s) return prop; // eslint-disable-next-line
		for(var prop, s, p = "Webkit Moz Ms O Khtml", p = (p.toLowerCase() + p).split(" "), i = 0; i < 10; ++i)
			if((prop = p[i]+n) in s) return prop;
		return "";
	})("TabSize");

	for(const el of document.querySelectorAll("[data-tab-size], .prism-code"))
		el.dataset.tabSize = el.style[TAB_SIZE] = +preferredSize || 4;

	for(const el of document.querySelectorAll("clipboard-copy[value]"))
		el.value = unfuckTabstops(el.value);

	if(!document.styleSheets.length){
		const el = document.head.appendChild(document.createElement("style"));
		el.innerHTML = "*, *::before, *::after {\n" + ["-moz-", "-o-", ""]
			.map(prefix => `${prefix}tab-size: ${+preferredSize || 4} !important`)
			.join("; ") + "\n}";
	}
	else for(const sheet of document.styleSheets)
		try{
			for(const rule of [...sheet.rules])
				if(rule instanceof CSSStyleRule && !Number.isNaN(+rule.style[TAB_SIZE]))
					rule.style[TAB_SIZE] = +preferredSize || 4;
		}
		catch(e){
			console.error(e);
		}
	
	for(const el of document.querySelectorAll("[style]"))
		if([...el.style].includes("tab-size"))
			el.style[TAB_SIZE] = +preferredSize || 4;

	// CodeMirror 5
	for(const {CodeMirror} of document.querySelectorAll(".CodeMirror")){
		try{
			CodeMirror.setOption("indentWithTabs", true);
			CodeMirror.setOption("indentUnit", +preferredSize || 4);
			CodeMirror.setValue(unfuckTabstops(CodeMirror.getValue()));
		}
		catch(e){}
	}
	
	// CodeMirror 6
	for(const {cmView} of document.querySelectorAll(".cm-editor [role='textbox']")){
		try{
			const str = cmView.editorView.state.doc.toString();
			const re = /^(?: {2})+/gm;
			const changes = [];
			let match;
			while(match = re.exec(str)){
				const from   = match.index;
				const to     = from + match[0].length;
				const insert = "\t".repeat(match[0].length / 2);
				changes.push({from, to, insert});
			}
			cmView.editorView.dispatch({changes});
		}
		catch(e){
			console.error(e);
		}
	}
	
	// GitHub's in-browser file editor
	for(const sizeField of document.querySelectorAll("select#indent-mode + select#indent-size")){
		sizeField.value = 4;
		sizeField.previousElementSibling.value = "tab";
	}
	
	for(const block of document.querySelectorAll(selector.join(", ")))
		for(const node of collectTextNodes(block)){
			const {data} = node;
			const fixed = unfuckTabstops(data);
			if(fixed !== data)
				node.data = fixed;
		}
})();
