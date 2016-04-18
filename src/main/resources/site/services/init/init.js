var portalLib = require('/lib/xp/portal');
var contentLib = require('/lib/xp/content');

exports.get = function (req) {
    var wsUrl = portalLib.serviceUrl({service: 'gameHub', type: 'absolute'});
    wsUrl = 'ws' + wsUrl.substring(wsUrl.indexOf(':'));
    var data = {
        wsUrl: wsUrl,
        games: getGames()
    };

    return {
        contentType: 'application/javascript',
        body: "var xphoot_data = " + JSON.stringify(data, null, 2) + ";"
    }
};

function getGames() {
    var result = contentLib.query({
        start: 0,
        count: 1000,
        sort: "modifiedTime DESC",
        contentTypes: [
            app.name + ":game"
        ]
    });

//    log.info('Games: %s', JSON.stringify(result, null, 4));

    var games = [], i, game, results = result.hits, res;
    for (i = 0; i < results.length; i++) {
        res = results[i];
        game = {};
        game.id = res._id;
        game.name = res.displayName;
        game.questions = res.data.questions.length;
        games.push(game);
    }

    return games;
}