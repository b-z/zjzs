var express = require('express');
var router = express.Router();

var model = require('../models/models');
var urls = require("../address_configure");

var TICKET_DB = model.tickets;
var ACTIVITY_DB = model.activities;
var SEAT_DB = model.seats;
var db = model.db;

function checkValidity(req, res, callback)
{
    if (req.query.ticketid == null)
    {
        res.send("ticketid is required!");
        return;
    }
    db[TICKET_DB].find({unique_id: req.query.ticketid}, function(err, docs)
    {
        if (docs.length == 0)
        {
            res.send("No such a ticket.");
            return;
        }
        else
        {
            var activityid = docs[0].activity;
            if (docs[0].status!=1 && docs[0].status!=2)
            {
                res.send("Wrong status.");
                return;
            }
            if (docs[0].seat!="")
            {
                res.render("notification",
                {
                    title: "提醒",
                    topic: "座位已选",
                    content: "您已经选过座位啦！座位是"+docs[0].seat
                });
                return;
            }

            db[ACTIVITY_DB].find({_id: activityid}, function(err, docs1)
            {
                if (docs1.length == 0)
                {
                    res.send("No activity found.");
                    return;
                }
                else
                {
                    if (docs1[0].need_seat!=1)
                    {
                        res.send("No need to choose seat.");
                        return;
                    }
                    var current=(new Date()).getTime();
                    if (current>=docs1[0].book_start && current<=docs1[0].book_end)
                    {
                        res.render("notification",
                        {
                            title: "提醒",
                            topic: "选座时间已过",
                            content: "很抱歉，选座时间已过。如果您还没有选择座位，系统将稍后给您随机分配。"
                        });
                        return;
                    }
                    callback(req.query.ticketid, activityid, docs1[0].book_end);
                }
            });
        }
    });
}

function getTime(datet,isSecond)
{
    if (!(datet instanceof Date))
        datet=new Date(datet);
    return datet.getFullYear() + "年"
        + (datet.getMonth()+1) + "月"
        + (datet.getDate()+1) + "日 "
        + datet.getHours() + ":"
        + datet.getMinutes()
        + (isSecond===true? ":"+datet.getSeconds() : "");
}
router.get("/", function(req, res)
{
    checkValidity(req,res,function(ticketID, activityID, bookend)
    {
        db[SEAT_DB].find({activity:activityID},function(err, docs)
        {
            if (err || docs.length==0)
            {
                res.send("Error.");
                return;
            }

            res.render("seat",
            {
                tid:        ticketID,
                bookddl:    getTime(endtime),
                ArestTicket:(docs[0]["A"]==null?0:docs[0]["A"]),
                BrestTicket:(docs[0]["B"]==null?0:docs[0]["B"]),
                CrestTicket:(docs[0]["C"]==null?0:docs[0]["C"]),
                DrestTicket:(docs[0]["D"]==null?0:docs[0]["D"]),
                ErestTicket:(docs[0]["E"]==null?0:docs[0]["E"])
            });
        });
    });
});

module.exports = router;