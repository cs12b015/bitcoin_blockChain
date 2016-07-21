var net = require('net');
var fs = require('fs');
var args = process.argv.slice(2);
var thisnode = args[0];
var counter=5;

var Transaction = function(id,from, to, amount,verified,tlist,spent) {
	this.id=id;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.verified=verified;
    this.spent = spent;
    this.tlist = tlist;
};

var Block = function(previous,transactionlist){
	this.previous=previous;
	this.transactionlist=transactionlist;
}

var parse_inp_tran= function(string){
	var str_array = string.split(" ");
	if(str_array[0]=="send"){
		var t_to = str_array[1];
		var t_list = str_array[2].slice(1,str_array[2].length-1).split(",");
		var t_amount = str_array[3];
		var tran = new Transaction("",thisnode,t_to,t_amount,0,t_list,0);
		return tran;
	}
	return "error";	
}

var stringify_tran = function(pat){
	var str=pat.id+" "+pat.from+" "+pat.to+" "+pat.amount+" "+pat.verified+" ["
	var arr = pat.tlist;
	for(var i=0;i<arr.length;i++){
		if(i==arr.length-1){
			str+=arr[i];
		}else{
			str+=arr[i]+",";
		}
	}
	str+="] "+pat.spent;
	return str;
}

var parse_tran= function(string){
	var array =string.split(" ");
	var t_list = array[6].slice(1,array[6].length-1).split(",");
	var tran = new Transaction(array[1],array[2],array[3],array[4],array[5],t_list,array[7]);
	return tran;

}

var print_transactionlist = function(){
	console.log("printing transactionlist");
	for(var i=0;i<transactionlist.length;i++){
		console.log(stringify_tran(transactionlist[i]));
	}
}



var transactionlist=[];

var blocklist=[];
var nblk = new Block("null",[]);
var emptarray =[];
for(var i=1;i<6;i++){
	transactionlist.push(new Transaction(i,"Company",i,100,1,emptarray,0));
	nblk.transactionlist.push(new Transaction(i,"Company",i,100,1,emptarray,0));
}

blocklist.push(nblk);


var giveid=function(pat){
	var idd = counter+parseInt(thisnode);
	pat.id+=idd;
	counter+=5;
	return pat;
}


var invokefunk = function() {
  	var c = 0;
  	var timeout = setInterval(function() {
    	console.log("Creating block and sending to server");
	   	var str = create_block();
    	client.write(str);
    	c++;
    	if (c > 30) {
    	  	clearInterval(timeout);
    	}
  	}, 100000);
}


var create_block = function(){
	var blk_str="";
	for(var i=0;i<transactionlist.length;i++){
		if(transactionlist[i].verified=="0"){
			blk_str+=stringify_tran(transactionlist[i])+"\n";
		}
	}
	blk_str="BLOCK \n"+blk_str;
	return blk_str;
}



var client = new net.Socket();
client.connect(5000, '127.0.0.1', function() {
	invokefunk();
	
	console.log("Node"+thisnode+' Connected');
	console.log('Enter a transaction in this manner  \' send to_node_number [listof transaction ids] Amount\' ' );
	console.log(" Eg: \'send 5 [list] 12\'");

	console.log("It means it will send $12 to node 5 uing the list of transactions");

	process.stdin.setEncoding("ascii");
	process.stdin.on("data", function (input) {
	  	input=input.slice(0,input.length-1);
	  	var pat = parse_inp_tran(input);
		if(pat.to){
			pat=giveid(pat);
			var strr = stringify_tran(pat);
			strr= "TRAN "+strr;
			client.write(strr);
			
		}else{
			console.log(pat);
		}


	});

	//client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	data=""+data;
	console.log('Received: ' + data);

	var partdata = data.slice(0,5);
	if(partdata=="TRAN "){

	update_transaction(data);
	}else if (partdata=="BLOCK"){
		update_change(data);
		mark_verified(data);
	}else if (partdata == "CHANG"){
		var tran = parse_tran(data);
		transactionlist.push(tran);
		print_transactionlist();
	}
});

var update_change = function(data){
	var data_array = data.split("\n");
	for(var i=1;i<data_array.length-1;i++){
		data_array[i]="TRAN "+data_array[i];
		var curtran = parse_tran(data_array[i]);
		if(curtran.from==thisnode){
			var str =change_tran(curtran);
			
		}
	}


}

var change_tran = function(tran){
	var change=0;
	for (var i=0;i<transactionlist.length;i++){
		for(var j=0;j<tran.tlist.length;j++){
			if(transactionlist[i].id==tran.tlist[j]){
				change+=parseInt(transactionlist[i].amount);
			}
		}
	}
	var amount = parseInt(tran.amount);
	change=change-amount;
	var trans = new Transaction("",thisnode,thisnode,""+change,1,tran.tlist,0);
	trans = giveid(trans);
	trans_str = stringify_tran(trans);
	trans_str = "CHANGE "+trans_str;
	client.write(trans_str);
}



var mark_verified = function(data){
	var newblock = new Block(blocklist.length-1,[]);
	var data_array = data.split("\n");

	for(var i=1;i<data_array.length-1;i++){
		data_array[i]="TRAN "+data_array[i];
		var curtran = parse_tran(data_array[i]);
		curtran.verified="1";
		verify(curtran.id);
		newblock.transactionlist.push(parse_tran(data_array[i]));
	}

	blocklist.push(newblock);

}

var verify = function(id){
	for(var i=0;i<transactionlist.length;i++){
		if(transactionlist[i].id==id ){
			transactionlist[i].verified="1";
			return;
		}
	}
}


var update_transaction = function(data){

	var tran = parse_tran(data);
	if(Verifytr(tran)=="1"){
		var t_array = tran.tlist;
		for(var i=0;i<t_array.length;i++){
			for(var j=0;j<transactionlist.length;j++){
				if(t_array[i]==transactionlist[j].id){
					transactionlist[j].spent="1";						
				}
			}
		}
		transactionlist.push(tran);
		print_transactionlist();
	}else{
		console.log("invalid Transaction")
	}


	
}




var Verifytr = function(tran){
	var checkflag="1";
	var amount1=0;
	var t_array = tran.tlist;
	for(var i=0;i<t_array.length;i++){
		for(var j=0;j<transactionlist.length;j++){
			if(t_array[i]==transactionlist[j].id){
				amount1+=parseInt(transactionlist[j].amount);
				if(transactionlist[j].spent=="1"){
					checkflag="0";
				}
				if(transactionlist[j].verified=="0"){
					checkflag="0";
				}
			}

		}
	}
	if(amount1 < parseInt(tran.amount) ){
		checkflag="0";
	}



	return checkflag;
}


client.on('close', function() {
	console.log('Server Connection closed');
	client.destroy();
});
