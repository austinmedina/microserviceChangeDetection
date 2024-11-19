import fs from 'fs';
import { diffLines } from 'diff';
import colors from 'colors';

function getChanges(myData) {
    let microservices = myData["microservices"];
    let nodes = [];
    let methods = {};
    
    for (let i=0; i<microservices.length;i++){
        let microservice = microservices[i];
        let nodeName = microservice["name"];
        // This if statement is used to filter nodes if a nodes_array 
        // has been inputted, and only uses nodes that are in the nodes_array
        // if (nodes_array == undefined || nodes_array.includes(nodeName)){
        //     nodes.push({
        //         "nodeName": nodeName,
        //         "nodeType": "microservice"
        //     });

        // } else {
        //     continue;
        // }
        
        let controllers = microservice["controllers"];
        for (let i=0; i<controllers.length; i++){
            let controller = controllers[i];
            let functions = controller["methods"];
            for (let i=0; i<functions.length; i++){
                let method = functions[i];
                let methodName = method["name"];
                let parameters = method["parameters"];
                let returnType = method["returnType"];
                let url = method["url"];
                let http = method["httpMethod"];
                // Check if this method has a default annotation, then also add that url
                if ((method["annotations"]?.[0]) && ("default" in method["annotations"][0]["attributes"])) {
                    let temp_url = method["annotations"][0]["attributes"]["default"];
                    methods[temp_url] = {
                        "microservice" : nodeName, 
                        "parameters": parameters,
                        "returnType": returnType,
                        "methodName": methodName,
                        "className": method["className"],
                        "httpMethod": http,
                    }
                } else {
                    methods[url] = {
                        "microservice" : nodeName, 
                        "parameters": parameters,
                        "returnType": returnType,
                        "className": method["className"],
                        "methodName": methodName,
                        "httpMethod": http,
                    }
                }
            }
        }
    }

    let connections = [];
    let links = {};
    // array can be controller or service
    function iterateThrough(array){
        for (let i=0; i<array.length; i++){
            let arr = array[i];
            let methodCalls = arr["methodCalls"];
            for (let i=0; i<methodCalls.length; i++){
                let methodCall = methodCalls[i];
                // This is calling another microservice if the methodCall 
                // has a url parameter defined
                if (!("url" in methodCall)){
                    continue;
                }
                
                let url = methodCall["url"];
                if (!(url in methods)){
                    continue;
                }
                
                let http = methodCall["httpMethod"];
                let className;
                if (arr["implementedTypes"].length == 1){ 
                    className = arr["implementedTypes"][0];
                } else {
                    className = arr["name"];
                }
                let calledFrom = methodCall["calledFrom"];
                let destination = methods[url]["microservice"];
                let source = methodCall["microserviceName"];
                let parameters = methodCall["parameterContents"];
                let name = source.concat(" --> ", destination);
                if (source != destination){
                    // Check if this connection is already in 
                    // connections array
                    if (!(connections.includes(name))){
                        connections.push(name);
                        links[name] =
                            {
                                "source": source,
                                "target": destination,
                                "requests": [
                                    {
                                    "destinationUrl": url,
                                    "sourceMethod": calledFrom,
                                    "endpointFunction": methodCall["name"],
                                    "className": className,
                                    "destinationclassName": methods[url]["className"],
                                    "type": http,
                                    "argument": parameters,
                                    "msReturn": methods[url]["returnType"],
                                    }
                                ]
                            };
                    } else {
                        // The index of this connection in the connections array
                        // is the same index in the links array. Find 
                        // the link based on the index of the name in 
                        // connections array and push a new object into 
                        // the "requests" parameter
                        links[name]["requests"].push(
                            {
                                "destinationUrl": url,
                                "sourceMethod": calledFrom,
                                "endpointFunction": methodCall["name"],
                                "className": className,
                                "destinationclassName": methods[url]["className"],
                                "type": http,
                                "argument": parameters,
                                "msReturn": methods[url]["returnType"],
                            }
                        );
                    }
                } 
            }
        }
    

    }

    for (let i=0; i<microservices.length;i++){
        let microservice = microservices[i];
        let nodeName = microservice["name"];

        // if (!(nodes_array == undefined) && !(nodes_array.includes(nodeName))){
        //     continue;
        // }

        let controllers = microservice["controllers"];
        let services = microservice["services"];
        iterateThrough(services);
        iterateThrough(controllers);
    }

    return {
        "graphName": "msgraph",
        "nodes": nodes, 
        "links": links, 
        "gitCommitId": "0"
    };
}

function getLinkDifferences(link1, link2) {
    var mySet1 = new Set();
    var mySet2 = new Set();

    for (let k in link1) {
        mySet1.add(k);
    }
    for (let k in link2) {
        mySet2.add(k);
    }

    var additions = new Set([...mySet2].filter(x => !mySet1.has(x)));
    var subtractions = new Set([...mySet1].filter(x => !mySet2.has(x)));
    var unmodifiedLinks = new Set([...mySet1].filter(x => mySet2.has(x)));

    return {
        "linkAdditions" : additions,
        "linkSubtractions" : subtractions,
        "unmodifiedLinks": unmodifiedLinks
    }
}

function getRequestDifferences(requests1, requests2) {
    var additions = new Set([...mySet1].filter(x => !mySet2.has(x)));
    var subtractions = new Set([...mySet2].filter(x => !mySet1.has(x)));
    var unmodifiedLinks = new Set([...mySet1].filter(x => mySet2.has(x)));
    
    for (let i = 0; i <requests1.length; i++) {
        let addition = false;
        for (let j = 0; j < requests2.length; j++) {
            if (requests[i]['source'] = requests[j]['source']) {
                continue;
            }
        }
    }

    

    return {
        "linkAdditions" : additions,
        "linkSubtractions" : subtractions,
        "unmodifiedLinks": unmodifiedLinks
    }
}

const findModifications = (linkA, linkB) => {
    let connectionAdditions = {};
    let requestAdditions = {};
    let connectionSubtractions = {};
    let requestSubtractions = {};
    let unmodified = {};

    const linkDifferences = getLinkDifferences(linkA, linkB);
    
    for (let k in linkDifferences["linkAdditions"]) {
        connectionAdditions[k] = linkB[k];
    }

    for (let k in linkDifferences["linkSubtractions"]) {
        connectionSubtractions[k] = linkA[k];
    }

    
    for (let k in linkDifference['unmodifiedLinks']) {
        let requestsA = linkA[k]['requests']
        let requestsB = linkB[k]['requests']
        subLinkDifferences = getRequestDifferences(requestsA, requestsB)
    }
    
    return {
        "connectionAdditions": connectionAdditions,
        "requestAdditions": requestAdditions,
        "connectionSubtractions": connectionSubtractions,
        "requestSubtractions": requestSubtractions,
        "unmodified": unmodified,
    }
    
};

function compareChanges() {
    const file1 = JSON.parse(fs.readFileSync("./data/IR2_57b3.json", 'utf-8'));
    const file2 = JSON.parse(fs.readFileSync("./data/IR319_350f.json", 'utf-8'));
    const commitLink1 = getChanges(file1)['links'];
    const commitLink2 = getChanges(file2)['links'];

    //Need to find subtractions and additions in the requests of 
    const modifications = findModifications(commitLink1, commitLink2);
    console.log("blah");
}

compareChanges();