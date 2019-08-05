#!/usr/bin/env node
const request = require('request');

request.post('https://api.monday.com/v2',{
  headers: {
    Authorization: "MONDAY_API_KEY"
    ,"Content-Type":"application/json",
  },
  json: {query:"{  boards(ids: MONDAY_BOARD_ID) {\n name\n items {\n      id\n      name\n  group { \n title\n }    updates { \n    body\n      }    }}} "}},function optionalCallback(err, httpResponse, body){


    body.data.boards[0].items.map(function(e){
      var link = "LINK_TO_MONDAY_BOARD"+e.id
      if(e.updates[0]){
        var statusDescription = link;
        e.updates.map(function(b){
          statusDescription = (b.body.replace(/<[^>]*>?/gm, ''))+"\n  \n "+statusDescription;

        });




      }else{ var statusDescription = link;}



      if(e.group.title === "Closed"){
        var taskStatus = "resolved"; var taskStatusName = "Resolved"
      }else{ var taskStatus = "open"; var taskStatusName = "Open"}

      request.post('LINK_TO_PHABRICATOR/api/maniphest.search ', {form:{
        "api.token":"PHABRICATOR_API_TOKEN",
        "constraints[query]": "(mondayId="+e.id+")"
      }},function optionalCallback(err, httpResponse, body){
        console.log(body)


        var jsonbody = JSON.parse(body)
        if(jsonbody.result.data[0]){
          var taskId = jsonbody.result.data[0].phid
        }else { var taskId = ""}

        // if(false)

        request.post('LINK_TO_PHABRICATOR/api/maniphest.edit', {form:{
          "api.token":"PHABRICATOR_API_TOKEN",
          "transactions[0][type]":"title",
          "transactions[0][value]": e.name+"(mondayId="+e.id+")",
          "transactions[1][type]":"status",
          "transactions[1][value]": taskStatus,
          "transactions[1][name]": taskStatusName,
          "transactions[2][type]": "description",
          "transactions[2][value]": statusDescription,
          "transactions[3][type]":"projects.set",
          "transactions[3][value]": ['PHABRICATOR_PROJECT_TAG'],
          "objectIdentifier": taskId


        }},function optionalCallback(err, httpResponse, body){
          console.log(err,httpResponse,body)
        })
      })
    })

  })
