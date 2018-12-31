function analyze() {
  var prefs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  var prefsData = prefs.getDataRange().getValues();
    
  var actualAss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2017-2018 Actual Assignments");
  var actualAssData = actualAss.getDataRange().getValues();
  
  var demoAss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Assignments");
  var demoAssData = demoAss.getDataRange().getValues();
  
  var results = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2017-2018 Actual Assignments Analysis");
  
  var teacherInfo = {};

  for(var r = 1; r < prefsData.length; r++) {
        
    var email = prefsData[r][6];
    var teacher = new Teacher(email);
    
    for(var c = 1; c <= 5; c++) {
      
      var duty = prefsData[r][c];
      
      if(duty != "" && duty != undefined && duty != null) {
        teacher.dutyList.push(duty);
      }
    }
    
    teacherInfo[email] = teacher;
  }
    
  for(var r = 0; r < actualAssData.length; r++) {
    var duty = actualAssData[r][0];
    for(var c = 1; c < actualAssData[r].length; c++) {
      var teacher = actualAssData[r][c];
      
      if(teacher == "" || teacher == undefined || teacher == null)
        break;
             
      if(teacherInfo[teacher] === undefined) {
        Logger.log("Couldn't find matching techer - probably error in Actual Assignments Sheet: " + r + " " + teacher);
      }
      else {
        teacherInfo[teacher].actualDuty = duty;
      }
    }
  }
  
  for(var r = 0; r < demoAssData.length; r++) {
    var duty = demoAssData[r][0];
    for(var c = 1; c < demoAssData[r].length; c++) {
      var teacher = demoAssData[r][c];
      
      if(teacher == "" || teacher == undefined || teacher == null)
        break;
      
      teacherInfo[teacher].demoDuty = duty;
    }
  }
  
  var data = [];
  data.push(["email", "Actual Duty", "Pref Rank, 6 = Not In List", "Program Duty", "Pref Rank, 6 = Not In List"]);
  for (var email in teacherInfo) {
    
    if (teacherInfo.hasOwnProperty(email)) {
        
      var row = [];
      data.push(row);
      row.push(email);
      
      var teacher = teacherInfo[email];
      
      row.push(teacher.actualDuty);
      var pos = teacher.dutyList.indexOf(teacher.actualDuty);
      row.push(pos == -1 ? 6 : pos + 1);
      row.push(teacher.demoDuty);
      pos = teacher.dutyList.indexOf(teacher.demoDuty);
      row.push(pos == -1 ? 6 : pos + 1);
      
    }
  }
  
  
  results.getRange(1, 1, data.length, 5).setValues(data);
               
  
}

function Teacher(e) {
  this.email = e;
  this.dutyList = [];
  
  this.actualDuty = "";
  this.demoDuty = "";
}
