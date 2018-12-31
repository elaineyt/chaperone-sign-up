//https://sites.google.com/site/indy256/algo/min_cost_flow_bf

var BIG_INT = 2000000000;
var UNASSIGNED_DUTY = "ASSIGNED TO NO DUTY";

function mrfSolve(assignments, eventSpace, unfilledDuties, teacherChoices, data) {
  
  var teacherNames = [];
  var teacherNamesToPosition = new Map;
  
  var dutyNames = [];
  var dutyNamesToPosition = new Map;
  
  for (var i = 0; i++ < teacherChoices.size; teacherChoices.next()) {
    var email = teacherChoices.key();
    teacherNames.push(email);
    teacherNamesToPosition.put(email, i);
  }
  
  for (var i = 0; i++ < eventSpace.size; eventSpace.next()) {
    var duty = eventSpace.key();
    dutyNames.push(duty);
    dutyNamesToPosition.put(duty, i + teacherNames.length);
  }
  
  var source = 0;
  var sink = 1 + teacherNames.length + dutyNames.length;
  var graph = createGraph(sink + 1);
  
  for(var i = 0; i++ < teacherChoices.size; teacherChoices.next()) {
    var email = teacherChoices.key();
    var choices = teacherChoices.get(email);
    
    //edge from the source to the teacher - each teacher gets 1 final choice
    addEdge(graph, 0, i, 1, 0);
        
    //edges from teacher to different duties

    for(var j = 0; j < choices.length; j++) {
      
      var dutyName = choices[j];
      
      if(choices[j] !== '' && choices[j] !== undefined && choices[j] !== null) {
        var dutyPos = parseInt(dutyNamesToPosition.get(dutyName));
                
        addEdge(graph, i, dutyPos, 1, j*j); //make this j*j to exagerate cost
      }
    }
  }
  
  for(var i = 0; i++ < eventSpace.size; eventSpace.next()) {
    var duty = eventSpace.key();
    var pos = parseInt(dutyNamesToPosition.get(duty));
    var count = parseInt(eventSpace.get(duty));
    
    //edge from duty to the sink
        
    addEdge(graph, pos, sink, count, 0);
  }
  
  var res = minCostFlow(graph, source, sink, BIG_INT);
  var flow = res[0];
  var flowCost = res[1];
  
  var unAssignedTeachers = [];
  
  //teacher name vertex
  for(var i = 1; i < 1 + teacherNames.length; i++) {
        
    var edges = graph[i];
    var foundOne = false;
        
    for(var j = 0; j < edges.length; j++) {   
    
      var edge = edges[j];
      
      if(edge.f > 0) {
            
        var dutyPos = parseInt(edge.to);      
        var dutyName = dutyNames[dutyPos - 1 - teacherNames.length];
        
        var array = assignments.get(dutyName);
        
        if(array === undefined) {
          array = [];
          
          assignments.put(dutyName, array);
        }
        array.push(teacherNames[i-1]);
        
        foundOne = true;
        
        //should only be added to one... but just in case... we'll break out of this loop
        break;
      }
    }
    
    if(!foundOne) {
      unAssignedTeachers.push(teacherNames[i-1]);
    }
    
  }
  

  //this loop will go through and dtermine which duties are unfilled
  var dutiesLeft = [];  
  for(var i =  teacherNames.length + 1; i < sink; i++) {
    
    var edges = graph[i];
    
    for(var j = 0; j < edges.length; j++) {
      
      var edge = edges[j];
      
      if(edge.f >= 0 && edge.f < edge.cap) {
        dutiesLeft.push({name:dutyNames[i - teacherNames.length - 1], taken:edge.f, cap:edge.cap});
      }
      
      /*while(edge.f >= 0 && edge.f < edge.cap && unAssignedTeachers.length > 0) {
        
        var dutyName = dutyNames[i - teacherNames.length - 1];
        
        var array = assignments.get(dutyName);
        
        if(array === undefined) {
          array = [];
          
          assignments.put(dutyName, array);
        }
        array.push(unAssignedTeachers.shift());
        
        edge.f++;
      }*/
      
    }
  }
  
  //while we have some duties to fill and teachers to fill woth them
  while(dutiesLeft.length > 0 && unAssignedTeachers.length>0) 
  {
    //sort from smallest percent full to biggest percent full
    dutiesLeft.sort(function(a, b) {
      
      return a.taken * b.cap - b.taken * a.cap;
      
    });
    
    //select the least percent filled duty
    var duty = dutiesLeft[0];
    var dutyName = duty.name;
    var array = assignments.get(dutyName);
    
    if(array === undefined) {
      array = [];
      
      assignments.put(dutyName, array);
    }
    
    duty.taken++;
    if(duty.taken == duty.cap) {
      dutiesLeft.shift();
    }
    
    array.push(unAssignedTeachers.shift());
  }
  
  
  if(unAssignedTeachers.length > 0) {
    var array = [];
    assignments.put(UNASSIGNED_DUTY, array);
    
    for(var i = 0; i < unAssignedTeachers.length(); i++) {
      array.push(unAssignedTeachers[i]);
    }
  }
  
  return 0;
}

function Edge(v, cap, cost, rev) {
  this.to = v;
  this.f = 0;
  this.cap = cap;
  this.cost = cost;
  this.rev = rev;
}

Edge.prototype.toString = function() {
  return  "to: " + this.to + 
    "\tflow: " + this.f +
      "\tcap: " + this.cap + 
        "\tcost: " + this.cost +
          "\trev: " + this.rev;
}


function createGraph(n) {
  var graph = [];
  for (var i = 0; i < n; i++) {
    graph[i] = [];
  }
  return graph;
}

function addEdge(graph, s, t, cap, cost) {
  graph[s].push(new Edge(t, cap, cost, graph[t].length));
  graph[t].push(new Edge(s, 0, -cost, graph[s].length - 1));
}

function bellmanFord(graph, s, dist, prevnode, prevedge, curflow) {
  var n = graph.length;
  for(var i = 0; i < n; i++)
    dist[i] = BIG_INT;
  
  dist[s] = 0;
  curflow[s] = BIG_INT;
  var inqueue = Array.apply(null, Array(n)).map(Boolean.prototype.valueOf,false);
  var q = Array.apply(null, Array(n)).map(Number.prototype.valueOf,0);
  var qt = 0;
  q[qt++] = s;
  
  for (var qh = 0; (qh - qt) % n != 0; qh++) {
    var u = q[qh % n];
    inqueue[u] = false;
    for (var i = 0; i < graph[u].length; i++) {
      var e = graph[u][i];
      if (e.f >= e.cap)
        continue;
      var v = e.to;
      var ndist = dist[u] + e.cost;
      if (dist[v] > ndist) {
        dist[v] = ndist;
        prevnode[v] = u;
        prevedge[v] = i;
        curflow[v] = Math.min(curflow[u], e.cap - e.f);
        if (!inqueue[v]) {
          inqueue[v] = true;
          q[qt++ % n] = v;
        }
      }
    }
  }
}

function minCostFlow(graph, s, t, maxf) {
  var n = graph.length;
  var dist = Array.apply(null, Array(n)).map(Number.prototype.valueOf,0);
  var curflow = Array.apply(null, Array(n)).map(Number.prototype.valueOf,0);
  var prevedge = Array.apply(null, Array(n)).map(Number.prototype.valueOf,0);
  var prevnode = Array.apply(null, Array(n)).map(Number.prototype.valueOf,0);
  
  var flow = 0;
  var flowCost = 0;
  
  while (flow < maxf) {
    bellmanFord(graph, s, dist, prevnode, prevedge, curflow);
    
    if (dist[t] == BIG_INT)
      break;
    var df = Math.min(curflow[t], maxf - flow);
    flow += df;
    for (var v = t; v != s; v = prevnode[v]) {
      var e = graph[prevnode[v]][prevedge[v]];
      e.f += df;
      
      graph[v][e.rev].f -= df;
      flowCost += df * e.cost;
    }
  }
  
  return [flow, flowCost];
}

// Usage example
function test() {
  var graph = createGraph(6);
  
  addEdge(graph, 0, 1, 16, 1);
  addEdge(graph, 0, 2, 13, 1);
  addEdge(graph, 1, 2, 10, 1);
  addEdge(graph, 1, 3, 12, 1);
  addEdge(graph, 2, 1, 4, 1);
  addEdge(graph, 2, 4, 14, 1);
  addEdge(graph, 3, 2, 9, 1);
  addEdge(graph, 3, 5, 20, 1);
  addEdge(graph, 4, 3, 7, 1);
  addEdge(graph, 4, 5, 4, 1);
  
  var source = 0;
  var sink = 5;
  
  var res = minCostFlow(graph, source, sink, BIG_INT);
  var flow = res[0];
  var flowCost = res[1];
  Logger.log("Flow: " + flow);
  Logger.log("Flow Cost: " + flowCost);
  
  var pos = 0;
  for(var i = 0; i < graph.length; i++) {
    for(var j = 0; j < graph[i].length; j++) {
      var e = graph[i][j];
      if(e.f > 0) {
        Logger.log("from: "+ pos + "\t");
        Logger.log(e.toString());
      }
    }
    pos++;
    Logger.log("");
  }
}
