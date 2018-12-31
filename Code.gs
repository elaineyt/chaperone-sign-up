var UNASSIGNED_DUTY = "ASSIGNED TO NO DUTY";

function myFunction() {
  
  var assignments_BEST = new Map;
  var happiness_score_BEST = Number.MAX_VALUE; 
  
  for(var z = 0; z < 1; z++){
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Events");
    var data = sheet.getDataRange().getValues();
    
    var assignments = new Map;
    
    var eventSpace = new Map;
    
    for (var i = 1; i < data.length; i++) {
      eventSpace.put(data[i][0], data[i][1]); //eventSpace is a map of duties to number of spots available
    }
    
    var unfilledDuties = [];
    for (var i = 1; i < data.length; i++) {
      unfilledDuties.push(data[i][0]);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
    var data = sheet.getDataRange().getValues();
    
    var teacherChoices = new Map;
    
    for (var i = 1; i < data.length; i++) {
      var choices = [];
      for (var j = 1; j < 6; j++) {
        choices.push(data[i][j]);
      }
      teacherChoices.put(data[i][6], choices); //teacherChoices is a map of teacher's email addresses to an object storing their preferences
    }
    
    /*
    Logger.log("TeacherChoices");
    for (var i = 0; i++ < teacherChoices.size; teacherChoices.next()) {
    Logger.log(teacherChoices.key() + ' :-> ' + teacherChoices.value());
    }
    Logger.log("TeacherChoices");
    */
    
    happiness_score = mrfSolve(assignments, eventSpace, unfilledDuties, teacherChoices, data);
    //happiness_score = elaineStrat(assignments, eventSpace, unfilledDuties, teacherChoices, data);
    
    
    if (happiness_score < happiness_score_BEST){
      happiness_score_BEST = happiness_score;
      assignments_BEST = assignments;
    }
  }
  
  for (var i = 0; i++ < assignments_BEST.size; assignments_BEST.next()) {
    Logger.log(assignments_BEST.key() + ' : ' + assignments_BEST.value());
  }
  
  writeToAssignmentSheet(assignments_BEST);
  writeToStatSheet(assignments_BEST);
}

function elaineStrat(assignments, eventSpace, unfilledDuties, teacherChoices, data) {
  var weights = new Map;
  for (var i = 1; i < data.length; i++) {
    weights.put(data[i][6], 1);
  }
  
  var haveChoices = true;
  //   var count = 0;
  while (haveChoices) {
    
    var event = unfilledDuties[0]; //loop through unfilledDuties
    //    Logger.log('event ->' + event);
    
    var potentialChaperones = [];
    for (var i = 0; i++ < teacherChoices.size; teacherChoices.next()) {
      if (teacherChoices.value()[0] == event) {
        potentialChaperones.push(teacherChoices.key());
        //         Logger.log('event ->->' + teacherChoices.key());
      }
    }
    
    var numSpots = eventSpace.get(event);
    
    if (numSpots < potentialChaperones.length) {//-------------------------------------------------------------------------------------------------------------------------
      
      unfilledDuties.splice(unfilledDuties.indexOf(event), 1); //remove duty from unfilledDuties
      
      var weightList = [];
      for (var i = 0; i < potentialChaperones.length; i++) {
        weightList.push(weights.get(potentialChaperones[i]));
      }
      
      var selectedTeachers = assign(potentialChaperones, weightList, numSpots);
      if (assignments.get(event) == '' || assignments.get(event) == undefined) {
        assignments.put(event, selectedTeachers);
        //Logger.log('assignments numspots less 1 ->' + event + ' ->' + selectedTeachers);
      }
      else {
        assignments.put(event, assignments.get(event).concat(selectedTeachers));
        //Logger.log('assignments numspots less 1B ->' + event + ' ->' + selectedTeachers);
      }
      
      for (var i = 0; i < selectedTeachers.length; i++) {
        // Logger.log('remove from teacherChoices ->' + selectedTeachers[i]);
        teacherChoices.remove(selectedTeachers[i]);
        potentialChaperones.splice(potentialChaperones.indexOf(selectedTeachers[i]), 1);   //potentialChaperones left with teachers who didn't get choice
      }
      
      for (var i = 0; i < potentialChaperones.length; i++) {
        weights.put(potentialChaperones[i], weights.get(potentialChaperones[i]) + 1); //add 1 to weight if teacher didn't get choice      
      }
      
      //remove duty from all of teacher's choices
      for (var i = 0; i++ < teacherChoices.size; teacherChoices.next()) {
        
        for (var j = teacherChoices.value().length - 1; j >= 0; j--) {
          if (teacherChoices.value()[j] == event) {
            var newTeacherChoices = teacherChoices.value();
            newTeacherChoices.splice(j, 1);
            teacherChoices.put(teacherChoices.key(), newTeacherChoices);
          }
        }
      }
    }
    else if (numSpots >= potentialChaperones.length) {//-------------------------------------------------------------------------------------------------------------------------
      
      // if there are teachers to be assigned
      if (potentialChaperones.length > 0) {
        
        if (assignments.get(event) == '' || assignments.get(event) == undefined) {
          assignments.put(event, potentialChaperones);
          // Logger.log('assignments numspots more 1 ->' + event + ' ->' + potentialChaperones);
        }
        else {
          assignments.put(event, assignments.get(event).concat(potentialChaperones));
          // Logger.log('assignments numspots more 1B ->' + event + ' ->' + potentialChaperones);
        }
        
        eventSpace.put(event, (numSpots - potentialChaperones.length)); //change number of spots available
        
        for (var i = 0; i < potentialChaperones.length; i++) {
          //  Logger.log('remove from teacherChoices ->' + potentialChaperones[i]);
          teacherChoices.remove(potentialChaperones[i]);
        }
      }
      
      unfilledDuties.push(unfilledDuties.shift());//add duty to end of the list
    }
    
    
    //teachers can't get any of their choices
    haveChoices = false;
    for (var i = 0; i++ < teacherChoices.size; teacherChoices.next()) {
      if (teacherChoices.value().length > 0)
        haveChoices = true;
    }
  }
  
  var leftOverDuties = [];
  for (var i = 0; i < unfilledDuties.length; i++) {
    for (var j = 0; j < eventSpace.get(unfilledDuties[i]) ; j++) {
      leftOverDuties.push(unfilledDuties[i]);
    }
  }
  
  //Logger.log('leftOverDuties ->' + leftOverDuties);
  
  for (var i = 0; i < teacherChoices.size; teacherChoices.next()) {
    
    if (assignments.get(leftOverDuties[i]) == '' || assignments.get(leftOverDuties[i]) == undefined) {
      
      // Logger.log('assignments force 2 ->' + leftOverDuties[i] + ' ->' + teacherChoices.key());
      assignments.put(leftOverDuties[i], [teacherChoices.key()]);
    }
    else {
      
      // Logger.log('assignments force 2B ->' + leftOverDuties[i] + ' ->' + teacherChoices.key());
      assignments.put(leftOverDuties[i], assignments.get(leftOverDuties[i]).concat([teacherChoices.key()]));
    }
    
    i++;
  }
  
  
  /*
  Logger.log("TeacherChoices");
  for (var i = 0; i++ < teacherChoices.size; teacherChoices.next()) {
  Logger.log(teacherChoices.key() + ' :-> ' + teacherChoices.value());
  }
  Logger.log("TeacherChoices");
  */
  
  var happiness_score = 0;
  
  
  for (var i = 0; i++ < assignments.size; assignments.next()) { //loops through assignments
    for(var j = 0; j < assignments.value().length; j++){ //loops through teachers within the event
      for (var k = 1; k < data.length; k++) { 
        if(data[k][6] == assignments.value()[j]){ //finds teacher in the spreadsheet
          happiness_score += 36;
          for (var l = 1; l < 6; l++) { //loops through teacher's choices
            if(data[k][l] == assignments.key()){
              happiness_score = happiness_score + l * l - 36; //adds square of choice number for the teacher to happiness score
            }
          }
        }
      }
      
    }
  }
  
  return happiness_score;
}


function writeToAssignmentSheet(assignments){
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var assignmentSheet = activeSpreadsheet.getSheetByName("Assignments");
  
  if (assignmentSheet != null) {
    activeSpreadsheet.deleteSheet(assignmentSheet);
  }
  
  assignmentSheet = activeSpreadsheet.insertSheet();
  assignmentSheet.setName("Assignments");
  
  
  for (var i = 0; i++ < assignments.size; assignments.next()) { 
    
    assignmentSheet.getRange(i,1).setValue(assignments.key());
    
    for(var j = 0; j < assignments.value().length; j++){ 
      assignmentSheet.getRange(i,j+2).setValue(assignments.value()[j]);
    }
  }
}

function writeToStatSheet(assignments){
  
  var choice1 = [];
  var choice2 = [];
  var choice3 = [];
  var choice4 = [];
  var choice5 = [];
  var choice6 = []; //didn't get there top 5
  var choice7 = []; //were not assigned
  
  
  
  var choiceBreakdown = new Map;
  choiceBreakdown.put(1, 0);
  choiceBreakdown.put(2, 0);
  choiceBreakdown.put(3, 0);
  choiceBreakdown.put(4, 0);
  choiceBreakdown.put(5, 0);
  choiceBreakdown.put(6, 0);
  choiceBreakdown.put(7, 0);
  
  var totalEntries = 0;
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 0; i++ < assignments.size; assignments.next()) { 
    for(var j = 0; j < assignments.value().length; j++){ 
      for (var k = 1; k < data.length; k++) { 
        if(data[k][6] == assignments.value()[j]){ 
          
          
          if(assignments.key() == UNASSIGNED_DUTY) {
            choice7.push(assignments.value()[j]);
            choiceBreakdown.put(7, choiceBreakdown.get(7)+1);
          }
          else {
            var foundOne = false;
            for (var l = 1; l < 6; l++) { 
              if(data[k][l] == assignments.key()){
                //---------------------------------------------
                if(l == 1){
                  choice1.push(assignments.value()[j]);
                }
                if(l == 2){
                  choice2.push(assignments.value()[j]);
                }
                if(l == 3){
                  choice3.push(assignments.value()[j]);
                }
                if(l == 4){
                  choice4.push(assignments.value()[j]);
                }
                if(l == 5){
                  choice5.push(assignments.value()[j]);
                }
                /*********************************************************/
                //HOW COULD l ever be 6 at this line of code?
                //And who uses l as a variable name?!  Looks like a 1...
                /*********************************************************/
                //if(l == 6){
                
                //}
                //---------------------------------------------
                
                foundOne = true;
                choiceBreakdown.put(l, choiceBreakdown.get(l)+1);
                totalEntries++;
                break;
              }
            }
            
          }
          
          if(!foundOne) {
            choice6.push(assignments.value()[j]);
            choiceBreakdown.put(6, choiceBreakdown.get(6)+1);
            totalEntries++;
          }
        }
      }
      
    }
  }
  
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var statSheet = activeSpreadsheet.getSheetByName("Stats");
  
  if (statSheet != null) {
    activeSpreadsheet.deleteSheet(statSheet);
  }
  
  statSheet = activeSpreadsheet.insertSheet();
  statSheet.setName("Stats");
  
  statSheet.getRange(1,1).setValue("Choice #1");
  statSheet.getRange(2,1).setValue("Choice #2");
  statSheet.getRange(3,1).setValue("Choice #3");
  statSheet.getRange(4,1).setValue("Choice #4");
  statSheet.getRange(5,1).setValue("Choice #5");
  statSheet.getRange(6,1).setValue("Auto Choice");
  statSheet.getRange(7,1).setValue("Not Assigned");
  
  for (var i = 0; i++ < choiceBreakdown.size; choiceBreakdown.next()) { 
    statSheet.getRange(i,2).setValue(choiceBreakdown.value()/totalEntries*100);
  }
  
  statSheet.getRange(6,2).setValue((100 - (statSheet.getRange(1, 2).getValue() + statSheet.getRange(2, 2).getValue() + statSheet.getRange(3, 2).getValue() + statSheet.getRange(4, 2).getValue() + statSheet.getRange(5, 2).getValue())));
  
  
  ////////////////////////////////////////
  /* UPDATED FOR FASTER WRITES TO SHEET */
  ////////////////////////////////////////
  var answers = [];
  answers.push([]);
  //---------------------------------------------
  for(var i = 0; i < choice1.length; i++){
    answers[0].push(choice1[i]);
    //statSheet.getRange(1,i+3).setValue(choice1[i]);
  }
  if(answers[0].length > 0) statSheet.getRange(1, 3, 1, answers[0].length).setValues(answers);
  
  
  answers = [];
  answers.push([]);
  for(var i = 0; i < choice2.length; i++){
    answers[0].push(choice2[i]);  
    //statSheet.getRange(2,i+3).setValue(choice2[i]);
  }
  if(answers[0].length > 0) statSheet.getRange(2, 3, 1, answers[0].length).setValues(answers);
  
  
  answers = [];
  answers.push([]);
  for(var i = 0; i < choice3.length; i++){
    answers[0].push(choice3[i]);  
    //statSheet.getRange(3,i+3).setValue(choice3[i]);
  }
  if(answers[0].length > 0) statSheet.getRange(3, 3, 1, answers[0].length).setValues(answers);
  
  
  answers = [];
  answers.push([]);
  for(var i = 0; i < choice4.length; i++){
    answers[0].push(choice4[i]); 
    //statSheet.getRange(4,i+3).setValue(choice4[i]);
  }
  if(answers[0].length > 0) statSheet.getRange(4, 3, 1, answers[0].length).setValues(answers);
  
  
  answers = [];
  answers.push([]);
  for(var i = 0; i < choice5.length; i++){
    answers[0].push(choice5[i]); 
    statSheet.getRange(5,i+3).setValue(choice5[i]);
  }
  if(answers[0].length > 0) statSheet.getRange(5, 3, 1, answers[0].length).setValues(answers);
  
  
  answers = [];
  answers.push([]);
  for(var i = 0; i < choice6.length; i++){
    answers[0].push(choice6[i]); 
    statSheet.getRange(6,i+3).setValue(choice6[i]);
  }  
  if(answers[0].length > 0) statSheet.getRange(6, 3, 1, answers[0].length).setValues(answers);
  
  
  answers = [];
  answers.push([]);
  for(var i = 0; i < choice7.length; i++){
    answers[0].push(choice7[i]); 
    statSheet.getRange(7,i+3).setValue(choice7[i]);
  }  
  if(answers[0].length > 0) statSheet.getRange(7, 3, 1, answers[0].length).setValues(answers);
  //---------------------------------------------
}

function assign(teacherList, weightList, numSpots) {
  var finalList = [];
  var tempList = [];
  for (var i = 0; i < teacherList.length; i++) {
    for (var j = 0; j < weightList[i]; j++) {
      tempList.push(teacherList[i]);
    }
  }
  
  for (var i = 0; i < numSpots; i++) {
    var selection = tempList[Math.floor((Math.random() * tempList.length))];
    finalList.push(selection);
    tempList.splice(tempList.indexOf(selection), weightList[teacherList.indexOf(selection)]);
  }
  
  return finalList;
}



function Map(linkItems) {
  this.current = undefined;
  this.size = 0;
  
  if (linkItems === false)
    this.disableLinking();
}

Map.noop = function () {
  return this;
};

Map.illegal = function () {
  throw new Error("illegal operation for maps without linking");
};

// map initialisation from existing object
// doesn't add inherited properties if not explicitly instructed to:
// omitting foreignKeys means foreignKeys === undefined, i.e. == false
// --> inherited properties won't be added

Map.from = function (obj, foreignKeys) {
  var map = new Map;
  
  for (var prop in obj) {
    if (foreignKeys || obj.hasOwnProperty(prop))
    map.put(prop, obj[prop]);
  }
  
  return map;
};

Map.prototype.disableLinking = function () {
  this.link = Map.noop;
  this.unlink = Map.noop;
  this.disableLinking = Map.noop;
  this.next = Map.illegal;
  this.key = Map.illegal;
  this.value = Map.illegal;
  this.removeAll = Map.illegal;
  
  return this;
};

// overwrite in Map instance if necessary
Map.prototype.hash = function (value) {
  return (typeof value) + ' ' + (value instanceof Object ?
                                 (value.__hash || (value.__hash = ++arguments.callee.current)) :
  value.toString());
};

Map.prototype.hash.current = 0;

// --- mapping functions

Map.prototype.get = function (key) {
  var item = this[this.hash(key)];
  return item === undefined ? undefined : item.value;
};

Map.prototype.put = function (key, value) {
  var hash = this.hash(key);
  
  if (this[hash] === undefined) {
    var item = { key: key, value: value };
    this[hash] = item;
    
    this.link(item);
    ++this.size;
  }
  else this[hash].value = value;
  
  return this;
};

Map.prototype.remove = function (key) {
  var hash = this.hash(key);
  var item = this[hash];
  
  if (item !== undefined) {
    --this.size;
    this.unlink(item);
    
    delete this[hash];
  }
  
  return this;
};

// only works if linked
Map.prototype.removeAll = function () {
  while (this.size)
    this.remove(this.key());
  
  return this;
};

// --- linked list helper functions

Map.prototype.link = function (item) {
  if (this.size == 0) {
    item.prev = item;
    item.next = item;
    this.current = item;
  }
  else {
    item.prev = this.current.prev;
    item.prev.next = item;
    item.next = this.current;
    this.current.prev = item;
  }
};

Map.prototype.unlink = function (item) {
  if (this.size == 0)
    this.current = undefined;
  else {
    item.prev.next = item.next;
    item.next.prev = item.prev;
    if (item === this.current)
      this.current = item.next;
  }
};

// --- iterator functions - only work if map is linked

Map.prototype.next = function () {
  this.current = this.current.next;
};

Map.prototype.key = function () {
  return this.current.key;
};

Map.prototype.value = function () {
  return this.current.value;
};
