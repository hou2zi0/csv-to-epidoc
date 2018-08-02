// @see https://github.com/hou2zi0/csv-to-epipoc


const getSeparator = function() {
  const separator = Array.from(document.querySelectorAll('[name="separator"]'))
    .filter((node) => {
      return (node.checked)
    });
  return separator[0].value;
};

const readFile = function() {
  switch (CONFIG.separator) {
    case 'csv':
      d3.csv(CONFIG.reader.result, function(data) {
          return data;
        })
        .then(function(data) {
          processFile(data);
        }, function(error) {
          console.log(error);
          CONFIG.fileLoaded = false;
        });
      break;
    case 'tsv':
      d3.tsv(CONFIG.reader.result, function(data) {
          return data;
        })
        .then(function(data) {
          processFile(data);
        }, function(error) {
          console.log(error);
          CONFIG.fileLoaded = false;
        });
      break;
    case 'psv':
      d3.dsv('|', CONFIG.reader.result, function(data) {
          return data;
        })
        .then(function(data) {
          processFile(data);
        }, function(error) {
          console.log(error);
          CONFIG.fileLoaded = false;
        });
      break;
  };
};

const processFile = function(data) {
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
  const applyAndExportButton = document.getElementById('poly-export')
    .addEventListener('click', (event) => {
      applyAndExport(data);
    });
};

const CONFIG = {
  "fileLoaded": false
};

const loadFile = function() {
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

const formatSection = function(text, element = 'p') {
  switch (element) {
    case 'person':
      return text.split('\n')
        .map((textblock, index) => {
          return `<person xml:id="${textblock.toLowerCase().replace(/[ ,.]/g,'_')}--${Math.random().toString().slice(2)}" sex="1">
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
          return `<${element} ident="" usage="${100/array.length}"/>${textblock.trim()}</${element}>`
        })
        .join('\n');
      break;
    case 'app':
      return text.split('\n')
        .map((textblock, index) => {
          return `<${element}><note>${textblock.trim()}</note></${element}>`
        })
        .join('\n');
      break;
    case 'bibl':
      return text.split('\n')
        .map((textblock) => {
          return `<${element}>${textblock.trim()}</${element}>`
        })
        .join('\n');
      break;
    case 'dimensions':
      const textblock = text.split('x');
      return `<height unit="cm">${(textblock[0])?textblock[0].trim():"NO VALUE EXTRACTED. DIMENSIONS ARE SPLIT ON 'x'."}</height>
      <width unit="cm">${(textblock[1])?textblock[1].trim():"NO VALUE EXTRACTED. DIMENSIONS ARE SPLIT ON 'x'."}</width>
      <depth unit="cm">${(textblock[2])?textblock[2].trim():"NO VALUE EXTRACTED. DIMENSIONS ARE SPLIT ON 'x'."}</depth>`;
      break;
    default:
      return text.split('\n')
        .map((textblock) => {
          return `<${element}>${textblock.trim()}</${element}>`
        })
        .join('\n');
      break;
  }
};

const applyAndExport = function(data) {
  const map = {};
  Array.from(document.getElementsByClassName('drop-down'))
    .forEach((node) => {
      map[node.getAttribute('id')] = node.getElementsByTagName('select')[0].value;
    });
  console.log(map);
  const jumppoint = document.getElementById('jump-point');
  jumppoint.innerHTML = `<a href="#output">Jump to code output!</a><hr/>`
  data.forEach((row) => {
    row['no-option'] = "No column was chosen for this EpiDoc section.";
    console.log(row[map['title']]);
    const output = document.getElementById('output');
    const div = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = row[map['title']];
    const pre = document.createElement('pre');
    const code = document.createElement('code');

    div.appendChild(h3);
    div.appendChild(pre);
    pre.appendChild(code);
    output.appendChild(div);
    code.textContent = `<teiHeader>
            <fileDesc>
                <titleStmt>
                    <title>${row[map['title']]}</title>
                    <editor>${row[map['editor']]}</editor>
                </titleStmt>
                <publicationStmt>
                    <authority>Scholarly Institution</authority>
                    <idno type="filename">${row[map['filename']]}>.xml</span></idno>
                    <availability status="free">
                        <licence target="http://creativecommons.org/licenses/by/4.0/">Creative Commons
                            Attribution 4.0 International Licence (CC BY 4.0)</licence>
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
                                ${row[map['handDesc']]}
                            </handDesc>
                            <scriptDesc>
                                ${row[map['scriptDesc']]}
                            </scriptDesc>
                            <decoDesc>
                                ${row[map['scriptDesc']]}
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
        </text>`;
  })
};