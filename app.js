var net = require('net');
var clients = [];
var ncount=1;
var bcount=0;
var blkarr =[];



net.createServer(function (socket) {

	socket.name = ncount;
	ncount++;
	clients.push(socket);

	socket.on('data', function (data) {
		data=""+data;
		if(data.split(" ")[0]=="TRAN")
			broadcast(data, socket);
		else if(data.split(" ")[0]=="BLOCK"){
			bcount++;
			console.log(bcount);
			blkarr.push(data);
			if(bcount == ncount-1){
				var rnum = Math.floor(Math.random() *bcount );
				broadcast(blkarr[rnum], socket);
			}
		}else if(data.split(" ")[0]=="CHANGE"){
			broadcast(data, socket)
		}

	});

	socket.on('end', function () {
		clients.splice(clients.indexOf(socket), 1);
	});
	

	// Send a message to all clients
	function broadcast(message, sender) {
		console.log("Node"+sender.name+" : "+message);
		clients.forEach(function (client) {
	      	client.write(message);
		});
	}


}).listen(5000);

// Put a friendly message on the terminal of the server.
console.log("Bitcoin server running at port 5000\n");