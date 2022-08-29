let $ = function (id) {
	return document.getElementById(id);
};

function encode64(data) {
	let r = '';
	for (let i = 0; i < data.length; i += 3) {
		if (i + 2 == data.length) {
			r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
		} else if (i + 1 == data.length) {
			r += append3bytes(data.charCodeAt(i), 0, 0);
		} else {
			r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
		}
	}
	return r;
}

function append3bytes(b1, b2, b3) {
	let c1 = b1 >> 2;
	let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
	let c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
	let c4 = b3 & 0x3f;
	let r = '';
	r += encode6bit(c1 & 0x3f);
	r += encode6bit(c2 & 0x3f);
	r += encode6bit(c3 & 0x3f);
	r += encode6bit(c4 & 0x3f);
	return r;
}

function encode6bit(b) {
	if (b < 10) {
		return String.fromCharCode(48 + b);
	}
	b -= 10;
	if (b < 26) {
		return String.fromCharCode(65 + b);
	}
	b -= 26;
	if (b < 26) {
		return String.fromCharCode(97 + b);
	}
	b -= 26;
	if (b == 0) {
		return '-';
	}
	if (b == 1) {
		return '_';
	}
	return '?';
}

var deflater = window.SharedWorker && new SharedWorker('rawdeflate.js');
if (deflater) {
	deflater.port.addEventListener('message', done_deflating, false);
	deflater.port.start();
} else if (window.Worker) {
	deflater = new Worker('rawdeflate.js');
	deflater.onmessage = done_deflating;
}

function done_deflating(e) {
	return 'http://www.plantuml.com/plantuml/img/' + encode64(e.data);
}

function compress(s) {
	s = unescape(encodeURIComponent(s));
	return done_deflating({ data: deflate(s) });
}
