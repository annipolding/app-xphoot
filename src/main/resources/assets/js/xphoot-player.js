var role = 'player';
var gamePin;
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);

var nick;

var startTime;

var currentQuestion;
var currentAnswer;

$(function () {
    setTimeout(function () {
        $('#pin').focus();
    });

    $('#pin,#nick').keypress(function (e) {
        if (e.which == 13) {
            var nick = $('#nick').val();
            var pin = $('#pin').val();
            sendJoin(role, nick, pin);
        }
    });
});


$('#sendJoin').on('click', function (e) {
    e.preventDefault();
    var nick = $('#nick').val();
    var pin = $('#pin').val();
    sendJoin(role, nick, pin);
});


// WS-STUFF

ws.onopen = function (event) {
    // TODO check connected
    $('#joinPanel').show();
};

var wsResponseHandlers = {};

ws.onmessage = function (event) {
    //console.log("Yay, a message for me: " + event.data);
    var data = JSON.parse(event.data);
    var action = data.action;

    var handler = wsResponseHandlers[action];
    if (handler) {
        handler(data);
    }
};

// WS END

// HANDLERS


function handleJoined(data) {
    if (data.error) {
        $('#message').text('Not able to join the game: ' + data.error);
    } else {
        gamePin = data.pin;
        $('#pin').text(data.pin);
        $('#message').text(data.nick + ' joined the game');
        nick = data.nick;
        $('#readyNick').text(data.nick);
        $('#joinPanel').hide();
        $('#readyPanel').show();
    }
}

function handleQuestionBegin(data) {
    currentAnswer = null;
    currentQuestion = data.question;

    layOutAnswerGrid($('#answer-grid'));

    getAllPanels().not($('#questStartPanel')).hide();
    $('#questStartPanel').show();

    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').fadeTo('fast', 1);

    $('#answerRed').on("click", {color: 'red', target: $('#answerRed')}, handlePlayerAnswered);
    $('#answerBlue').on("click", {color: 'blue', target: $('#answerBlue')}, handlePlayerAnswered);
    $('#answerGreen').on("click", {color: 'green', target: $('#answerGreen')}, handlePlayerAnswered);
    $('#answerYellow').on("click", {color: 'yellow', target: $('#answerYellow')}, handlePlayerAnswered);

    startTime = new Date().getTime();
}

function handlePlayerAnswered(e) {
    var timeUsed = new Date().getTime() - startTime;
    currentAnswer = e.data.color;
    sendPlayerAnswer(e.data.color, timeUsed);
    disableAnswers();
    highlightPlayerAnswer(e.data.target);
}

function handleQuestionEnded(data) {

    getAllPanels().hide();

    if (currentAnswer == data.correctAnswer) {
        $('#correctAnswerPanel').show();
    } else {
        $('#wrongAnswerPanel').show();
    }
}

function handleQuizEnd(answers) {

    var sortedPlayers = [];
    for (var player in answers) {
        if (answers.hasOwnProperty(player)) {
            sortedPlayers.push({player: player, score: answers[player]});
        }
    }
    sortedPlayers.sort(function (a, b) {
        return b.score - a.score;
    });

    var place = 1;
    sortedPlayers.forEach(function (p) {
        if (p.player == nick) {

            if (place == 1) {
                $('#playerPos').text("Winner!");
            } else if (place == 2) {
                $('#playerPos').text("Second place!");
            } else if (place == 3) {
                $('#playerPos').text("Third place!");
            } else {
                $('#playerPos').text(place + "th place");
            }
        }
        place++;
    });

    getAllPanels().hide();
    $('#quizEndPanel').show();
}

// HANDLERS END


// SEND

var send = function (data) {
    if (!data.pin && gamePin) {
        data.pin = gamePin;
    }
    if (!data.nick && nick) {
        data.nick = nick;
    }
    ws.send(JSON.stringify(data));
};

var sendJoin = function (role, nick, pin) {
    nick = nick ? nick.trim() : '';
    pin = pin ? pin.trim() : '';
    if (!pin || !nick) {
        return;
    }
    var req = {
        action: 'join',
        role: role,
        nick: nick,
        pin: pin
    };
    send(req);
};

var sendPlayerAnswer = function (answer, timeUsed) {
    var req = {
        action: 'playerAnswer',
        answer: answer,
        timeUsed: timeUsed
    };
    send(req);
};

// DISPLAY

function highlightPlayerAnswer(target) {
    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').not(target).fadeTo('fast', 0.2);
}

function disableAnswers() {
    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').off("click");
}

function getLayoutClass() {
    var layout = 2;

    if (currentQuestion.green) {
        if (currentQuestion.yellow) {
            layout = 4;
        } else {
            layout = 3;
        }
    }
    return "answer-grid-" + layout;
}

function layOutAnswerGrid(element) {
    var answerGrid = element;
    answerGrid.removeClass("answer-grid-2");
    answerGrid.removeClass("answer-grid-3");
    answerGrid.removeClass("answer-grid-4");
    answerGrid.addClass(getLayoutClass());

    if (!currentQuestion.red) {
        $('#answerRed').hide();
    } else {
        $('#answerRed').show();
    }

    if (!currentQuestion.blue) {
        $('#answerBlue').hide();
    } else {
        $('#answerBlue').show();
    }

    if (!currentQuestion.green) {
        $('#answerGreen').hide();
    } else {
        $('#answerGreen').show();
    }

    if (!currentQuestion.yellow) {
        $('#answerYellow').hide();
    } else {
        $('#answerYellow').show();
    }
}

// UTILS


function getAllPanels() {
    return $('#joinPanel,#readyPanel,#questStartPanel,#correctAnswerPanel,#wrongAnswerPanel,#quizEndPanel');
}

// EVENT HANDLER

wsResponseHandlers.joinAck = function (data) {
    handleJoined(data);
};

wsResponseHandlers.questBegin = function (data) {
    handleQuestionBegin(data);
};

wsResponseHandlers.questEnd = function (data) {
    handleQuestionEnded(data);
};

wsResponseHandlers.quizEnd = function (data) {
    handleQuizEnd(data.scores);
};

