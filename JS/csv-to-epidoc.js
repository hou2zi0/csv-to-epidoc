// @see https://github.com/hou2zi0/csv-to-epipoc


const getSeparator = function () {
	const separator = Array.from(document.querySelectorAll('[name="separator"]'))
		.filter((node) => {
			return (node.checked)
		});
	return separator[0].value;
};

const readFile = function () {
	switch (CONFIG.separator) {
	case 'csv':
		d3.csv(CONFIG.reader.result, function (data) {
				return data;
			})
			.then(function (data) {
				processFile(data);
			}, function (error) {
				console.log(error);
				CONFIG.fileLoaded = false;
			});
		break;
	case 'tsv':
		d3.tsv(CONFIG.reader.result, function (data) {
				return data;
			})
			.then(function (data) {
				processFile(data);
			}, function (error) {
				console.log(error);
				CONFIG.fileLoaded = false;
			});
		break;
	case 'psv':
		d3.dsv('|', CONFIG.reader.result, function (data) {
				return data;
			})
			.then(function (data) {
				processFile(data);
			}, function (error) {
				console.log(error);
				CONFIG.fileLoaded = false;
			});
		break;
	};
};

const processFile = function (data) {
	console.log(data);
	console.log(data.columns);
	Array.from(document.getElementsByClassName('drop-down'))
		.forEach((node) => {
			const dropdown = `<select>
       <option value="no-option" selected="selected">--Select an option--</option>
       ${data.columns.map(item => { return `<option value="${item.trim()}">${item.trim()}</option>`}).join('\n')}
       </select>`;
			node.innerHTML = dropdown;
		});
	CONFIG.fileLoaded = true;

	Array.from(document.getElementsByClassName('static-fields'))
		.forEach((node) => {
			node.setAttribute('style', 'visibility: normal;');
		});

	const applyAndExportButton = document.getElementById('poly-export')
		.addEventListener('click', (event) => {
			applyAndExport(data);
		});
};

const CONFIG = {
	"fileLoaded": false
};

const loadFile = function () {
	const Up = document.getElementById('poly-file')
		.addEventListener("change", (e) => {

			CONFIG.separator = getSeparator();

			const filehandle = document.getElementById('poly-file')
				.files[0];
			CONFIG.reader = new FileReader();

			if (filehandle) {
				CONFIG.reader.readAsDataURL(filehandle);
			}

			CONFIG.reader.addEventListener("load", () => {
				readFile();
			}, false);
		});
};

loadFile();

const epidocIDs = Array.from(document.getElementsByClassName('drop-down'))
	.map((node) => {
		return node.getAttribute('id');
	});

const generateID = function (textblock, trim = false) {
	const IDstring = textblock.toLowerCase()
		.replace(/[ .]/g, '_')
		.replace(/[,:;\(\)\[\]\<\>]/g, '');
	if (trim && textblock.length > 15) {
		return `${IDstring.slice(0,16)}--${Math.random().toString().slice(2)}`;
	} else {
		return `${IDstring}--${Math.random().toString().slice(2)}`;
	}
};

const formatSection = function (text, element = 'p') {
	if (text.startsWith('Error:')) {
		return `Error: No column was chosen for this EpiDoc section.`;
	} else {
		switch (element) {
		case 'person':
			return text.split('\n')
				.map((textblock, index) => {
					return `<person xml:id="${generateID(textblock, true)}" sex="1">
                        <persName>
                        ${textblock.trim()}
                        </persName>
                        <birth/>
                        <death/>
                        <floruit/>
                    </person>`
				})
				.join('\n');
			break;
		case 'lb':
			return text.split('\n')
				.map((textblock, index) => {
					return `<${element} n="${index+1}"/>${textblock.trim()}`
				})
				.join('\n');
			break;
		case 'language':
			return text.split('\n')
				.map((textblock, index, array) => {
					return `<${element} ident="" usage="${100/array.length}">${textblock.trim()}</${element}>`
				})
				.join('\n');
			break;
		case 'handNote':
			return text.split('\n')
				.map((textblock, index, array) => {
					return `<${element} scriptRef="" scope="" xml:id="${generateID(textblock, true)}">${textblock.trim()}</${element}>`
				})
				.join('\n');
			break;
		case 'scriptNote':
			return text.split('\n')
				.map((textblock, index, array) => {
					return `<${element} xml:id="${generateID(textblock, true)}" script="">${textblock.trim()}</${element}>`
				})
				.join('\n');
			break;
		case 'decoNote': //<scriptNote xml:id="script1" script="square_hebrew">
			return text.split('\n')
				.map((textblock, index, array) => {
					return `<${element} xml:id="${generateID(textblock, true)}" type="">${textblock.trim()}</${element}>`
				})
				.join('\n');
			break;
		case 'app':
			if (document.getElementById('separator-apparatus')
				.value != "") {
				const separator = document.getElementById('separator-apparatus')
					.value;
				console.log(separator);
				return text.split('\n')
					.map((textblock, index) => {
						const noteString = textblock.trim();
						const splittingIndex = (noteString.indexOf(separator) != -1) ? noteString.indexOf(separator) : 0;
						const locationReference = (splittingIndex) ? ` loc="${noteString.slice(0,splittingIndex)}"` : "";
						const noteText = (splittingIndex) ? `${noteString.slice(splittingIndex+1)}` : `${noteString.slice(0)}`;
						return `<${element}><note${locationReference}>${noteText.trim()}</note></${element}>`
					})
					.join('\n');
			} else {
				return text.split('\n')
					.map((textblock, index) => {
						return `<${element}><note>${textblock.trim()}</note></${element}>`
					})
					.join('\n');
			}
			break;
		case 'bibl':
			return text.split('\n')
				.map((textblock) => {
					return `<${element}>${textblock.trim()}</${element}>`
				})
				.join('\n');
			break;
		case 'graphic':
			return text.split('\n')
				.map((textblock) => {
					return `<${element} url="${textblock.trim()}">
              <desc>DESCRIPTION</desc>
            </${element}>`
				})
				.join('\n');
			break;
		case 'dimensions':
			const unit = document.getElementById('unit-dimensions')
				.value;

			if (document.getElementById('separator-dimensions')
				.value != "") {
				const separator = document.getElementById('separator-dimensions')
					.value;
				const textblock = text.split(separator);

				switch (textblock.length) {
				case 1:
					return `<height unit="${unit}">${(textblock[0])?textblock[0].trim():"NO VALUE EXTRACTED."}</height>`;
					break;
				case 2:
					return `<height unit="${unit}">${(textblock[0])?textblock[0].trim():"NO VALUE EXTRACTED.."}</height>
			      <width unit="${unit}">${(textblock[1])?textblock[1].trim():"NO VALUE EXTRACTED."}</width>`;
					break;
				case 3:
					return `<height unit="${unit}">${(textblock[0])?textblock[0].trim():"NO VALUE EXTRACTED."}</height>
			      <width unit="${unit}">${(textblock[1])?textblock[1].trim():"NO VALUE EXTRACTED."}</width>
			      <depth unit="${unit}">${(textblock[2])?textblock[2].trim():"NO VALUE EXTRACTED."}</depth>`;
					break;
				}

			} else {
				return `<dim unit="${unit}">${text.trim()}</dim>`;
			}
			break;
		default:
			return text.split('\n')
				.map((textblock) => {
					return `<${element}>${textblock.trim()}</${element}>`
				})
				.join('\n');
			break;
		}
	}
};

const applyAndExport = function (data) {
	const map = {};
	Array.from(document.getElementsByClassName('drop-down'))
		.forEach((node) => {
			map[node.getAttribute('id')] = node.getElementsByTagName('select')[0].value;
		});
	console.log(map);

	const out = [];

	const authority = document.getElementById('authority')
		.value;

	const LICENSES = {
		"CC0": {
			"string": "Creative Commons Public Domain (CC0) license. Freeing content globally without restrictions",
			"url": "https://creativecommons.org/publicdomain/zero/1.0/"
		},
		"CC_BY": {
			"string": "Creative Commons Attribution (CC BY) license",
			"url": "https://creativecommons.org/licenses/by/4.0/"
		},
		"CC_BY_SA": {
			"string": "Creative Commons Attribution ShareAlike (CC BY-SA) license",
			"url": "https://creativecommons.org/licenses/by-sa/4.0/"
		},
		"CC_BY_ND": {
			"string": "Creative Commons Attribution-NoDerivs (CC BY-ND) license",
			"url": "https://creativecommons.org/licenses/by-nd/4.0/"
		},
		"CC_BY_NC": {
			"string": "Creative Commons Attribution-NonCommercial (CC BY-NC) license",
			"url": "https://creativecommons.org/licenses/by-nd/4.0/"
		},
		"CC_BY_NC_SA": {
			"string": "Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA) license",
			"url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
		},
		"CC_BY_NC_ND": {
			"string": "Creative Commons Attribution-NonCommercial-NoDerivs (CC BY-NC-ND) license",
			"url": "https://creativecommons.org/licenses/by-nc-nd/4.0/"
		},
	};

	const licenseKey = document.getElementById('licenses')
		.value;

	const TOC = [];

	data.forEach((row) => {
		row['no-option'] = "Error: No column was chosen for this EpiDoc section.";
		console.log(row[map['title']]);
		const output = document.getElementById('output');
		const div = document.createElement('div');
		const h3 = document.createElement('h3');

		const entryTOC = {
			"headline": row[map['title']],
			"id": generateID(row[map['title']]),
		};

		h3.innerHTML = `${entryTOC.headline} <a href="#">[^]</a>`;
		h3.setAttribute('id', entryTOC.id);
		TOC.push(entryTOC);

		const pre = document.createElement('pre');
		const code = document.createElement('code');

		div.appendChild(h3);
		div.appendChild(pre);
		pre.appendChild(code);
		output.appendChild(div);
		const XML_output = `<TEI>
      <teiHeader>
            <fileDesc>
                <titleStmt>
                    <title>${row[map['title']]}</title>
                    <editor>${row[map['editor']]}</editor>
                </titleStmt>
                <publicationStmt>
                    <authority>${authority}</authority>
                    <idno type="filename">${row[map['filename']]}.xml</idno>
                    <availability status="free">
                        <licence target="${LICENSES[licenseKey].url}">This file is provided under a ${LICENSES[licenseKey].string}. Please follow the URL to obtain further information about the license.</licence>
                    </availability>
                </publicationStmt>
                <sourceDesc>
                    <msDesc>
                        <msIdentifier>
                            <settlement>${row[map['settlement']]}</settlement>
                            <repository>${row[map['repository']]}</repository>
                            <idno type="URI">${row[map['idno']]}</idno>
                        </msIdentifier>
                        <physDesc>
                            <objectDesc>
                                <supportDesc>
                                    <support>
                                        <objectType>${row[map['objectType']]}</objectType>
                                        <material>${row[map['material']]}</material>
                                        <dimensions>
                                            ${formatSection(row[map['dimensions']], 'dimensions')}
                                        </dimensions>
                                    </support>
                                </supportDesc>
                            </objectDesc>
                            <handDesc>
                                ${formatSection(row[map['handDesc']],'handNote')}
                            </handDesc>
                            <scriptDesc>
                                ${formatSection(row[map['scriptDesc']],'scriptNote')}
                            </scriptDesc>
                            <decoDesc>
                                ${formatSection(row[map['decoDesc']],'decoNote')}
                            </decoDesc>
                        </physDesc>
                        <history>
                            <origin>
                                <origDate>${row[map['originDate']]}</origDate>
                                <origPlace>
                                    <placeName>${row[map['originPlace']]}</placeName>
                                </origPlace>
                            </origin>
                        </history>
                    </msDesc>
                </sourceDesc>
            </fileDesc>
            <profileDesc>
                <particDesc>
                    <listPerson>
                        ${formatSection(row[map['listPerson']],'person')}
                    </listPerson>
                    <listRelation>
                        <relation name="" mutual=""/>
                    </listRelation>
                </particDesc>
                <langUsage>
                    ${formatSection(row[map['langUsage']],'language')}
                </langUsage>
            </profileDesc>
        </teiHeader>
        <facsimile>
          ${formatSection(row[map['facsimile']],'graphic')}
        </facsimile>
        <text>
            <body>
                <div type="edition" xml:space="default">
                    <div type="textpart" subtype="front" n="1" xml:lang="${row[map['language']]}">
                        <ab>
                            ${formatSection(row[map['transcription']],'lb')}
                        </ab>
                    </div>
                </div>
                <div type="translation">
                    <div type="textpart" n="1">
                        <p>
                            ${formatSection(row[map['translation']], 'lb')}
                        </p>
                    </div>
                </div>
                <div type="commentary" subtype="description">
                    ${formatSection(row[map['description']])}
                </div>
                <div type="commentary" subtype="commentary">
                    ${formatSection(row[map['commentary']])}
                </div>
                <div type="apparatus" subtype="edition">
                    <listApp n="1">
                        ${formatSection(row[map['apparatus']],'app')}
                    </listApp>
                </div>
                <div type="bibliography">
                    <listBibl>
                        ${formatSection(row[map['listBibl']],'bibl')}
                    </listBibl>
                </div>
            </body>
        </text>
      </TEI>`;
		code.setAttribute('class', 'xml tei-doc-link');
		code.textContent = XML_output;
		out.push(XML_output);
	})

	const jumppoint = document.getElementById('jump-point');
	const HR = document.createElement('hr');
	jumppoint.appendChild(HR);
	const UL = jumppoint.getElementsByTagName('ul')[0];

	TOC.forEach((snippet) => {
		const LI = document.createElement('li');
		LI.innerHTML = `<a href="#${snippet.id}">${snippet.headline}</a>`;
		UL.appendChild(LI);
	});

	TEI_DOC_LINK_CONFIG.teiDocLinks();
	console.log(out.length);

	const teiCorpus = `<teiCorpus xmlns="http://www.tei-c.org/ns/1.0">
                     <teiHeader/>
                     ${out.join('\n')}
                    </teiCorpus>`;
	prepareDownload(teiCorpus, "epidoc_converter.xml");
};

const prepareDownload = function (data, filename) {
	const content = data;
	const element = document.createElement('a');
	element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(content));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
};