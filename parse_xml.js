var strFileContent;

/*
Step 2 (opcional?) — Read File Metadata (Name, Type & Size) using Properties of File Object
The file selected by the user can be accessed as a File object in Javascript. 
The name, type & size properties of this File object gives the metadata of the chosen file.
*/
document.querySelector("#read-button").addEventListener('click', function() {
	if(document.querySelector("#file-input").files.length == 0) {
		alert('Error : não selecionou arquivos')
		return
	}

	// file selected by user
	let file = document.querySelector("#file-input").files[0]

	//não precisa nada do código abaixo para conseguir ler o arquivo
	let file_name = file.name
	let file_type = file.type
	let file_size = file.size
});

/*
Step 3 — Read File Contents using FileReader Object
The contents of the selected File object is read using the FileReader object. Reading is performed asynchronously, and both text and binary file formats can be read.

Text files (TXT, CSV, JSON, HTML etc) can be read using the readAsText() method.
Binary files (EXE, PNG, MP4 etc) can be read using the readAsArrayBuffer() method.
Data url string can be read using the readAsDataURL() method.
*/
document.querySelector("#read-button").addEventListener('click', function() {

	//náo consegui carregar sem passar pelo botáo anterior, apenas usando o default definido aqui
	if(document.querySelector("#file-input").files.length == 0) {
		alert('Error : No file selected');
		return
	}

	// file selected by user
	let file = document.querySelector("#file-input").files[0];

	// new FileReader object *************** FUNÇÃO QUE RETORNA UM OBJETO JAVASCRIPT QUE LÊ ARQUIVOS *****************
	let reader = new FileReader();

	// read file as text file ************** CHAMADA PRINCIPAL QUE LÊ O ARQUIVO *************************
	reader.readAsText(file);

	// event fired when file reading finished
	reader.addEventListener('load', function(e) {
	   // contents of the file (var para ficar disponível para outros métodos)
	    strFileContent = e.target.result;
		document.querySelector("#file-contents").textContent = strFileContent.substr(0,100) + '...'
		
		//faz o parse do XML: PRIMEIRO TEM QUE TRANSFORMAR A STRING XML EM UM XMLDOC  *************************
		//https://www.w3schools.com/xml/xml_parser.asp
		parser = new DOMParser();
		xmlDoc = parser.parseFromString(strFileContent,"text/xml");

		//*************** PARSE SEM XPATH, NAVEGANDO NO DOM MANUALMENTE ***************
		obterDadosNavegandoNoDOM_semParse()

		//********* PARSE PARA JSON *********/
		parseParaJson()
	});

	// event fired when file reading failed
	reader.addEventListener('error', function() {
	    alert('Error : erro ao ler arquivo');
	});

});


//obtem dado navegando no DOM, sem fazer parse além do XMLDOC
function obterDadosNavegandoNoDOM_semParse() {
	//obtem o node <classe><rendPJ><colecaoRendPJTitular><item 
	//		IRRFDecimoTerceiro="1.111,00" ... rendRecebidoPJ="111.111,22"/>
	let itemRendPJ = xmlDoc.getElementsByTagName('classe')[0].childNodes[3].childNodes[0].firstChild;	//é o <item>
	//atributos do item
	let rendRecebidoPJ = itemRendPJ.attributes.rendRecebidoPJ
	document.getElementById("rendRecebidoPJ").innerHTML = rendRecebidoPJ.value
}


//parse do XML para JSON: erro com a string do XML da receita, mesmo tirando a tag <XML> de abertura e os atributos de <classe>
function parseParaJson() {
	// gets JSON object from a string with xml content
	//tem que ter feito o parse da string para xmlDoc antes (DOMParser().parseFromString())
	var jsonFileContent = xmlToJson(xmlDoc);	
	//aqui o atributo "logradouro" da tag <classe><bens><item logradouro="rua ouro preto">(1a tag <item>) virou:
	logradouroBemItem0 = jsonFileContent.classe.bens.item[0]["@attributes"].logradouro
	document.getElementById("json1").innerHTML = logradouroBemItem0
};



// FUNÇÃO PARA TRANSFORMAR XML EM JSON:  ************  FUNCIONA   ************
// Changes XML to JSON: https://davidwalsh.name/convert-xml-json
function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};



//parse de um xml online com XPath: erro CORS
document.querySelector("#parse_arquivo_com_xpath").addEventListener('click', function() {

	//obtem o arquivo online
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			parseComXPath(xhttp.responseXML);
		}
	};
	//xhttp.open("GET", "books.xml", true);
	//se tentar ler do arquivo local, dá erro, mesmo com Laragon e localhost//: 
	//		Access to XMLHttpRequest at 
	//		'file:///D:/Tecnicos/HardESoftware/EmDesenvolvimento/irpf_patrimonio/app/books.xml' from origin 'null' has been blocked 
	//		by CORS policy: Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, 
	//		chrome-untrusted, https.
	xhttp.open("GET", "https://www.javatpoint.com/xmlpages/books.xml", true);
	xhttp.send(); 
	

	/* 	tutorial de XPATH: https://www.w3schools.com/xml/xpath_nodes.asp
	selecionando com XPath: https://www.w3schools.com/xml/xpath_syntax.asp
		Chrome, Firefox, Edge, Opera, and Safari use the evaluate() method to select nodes:
			xmlDoc.evaluate(xpath, xmlDoc, null, XPathResult.ANY_TYPE,null);
		Internet Explorer uses the selectNodes() method to select node:
			xmlDoc.selectNodes(xpath);
	*/
	function parseComXPath(xmlDoc) {
		var nodes = xmlDoc.evaluate('/bookstore/book/title', xmlDoc, null, XPathResult.ANY_TYPE, null)
		var result = nodes.iterateNext()
		while (result) {
			txt += result.childNodes[0].nodeValue + "<br>";
			result = nodes.iterateNext();
		}
	}

})

