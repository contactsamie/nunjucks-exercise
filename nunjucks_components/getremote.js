const request = require('sync-request');
module.exports = {
    getremote: function () {
        var blockStart = 'getremote';
        var blockEnd = 'endgetremote';
        this.tags = [blockStart];

        this.parse = function (parser, nodes, lexer) {
            // get the tag token
            var tok = parser.nextToken();

            // parse the args and move after the block end. passing true
            // as the second arg is required if there are no parentheses
            var args = parser.parseSignature(null, true);
            parser.advanceAfterBlockEnd(tok.value);

            // parse the body and possibly the error block, which is optional
            var body = parser.parseUntilBlocks('error', blockEnd);
            var errorBody = null;

            if (parser.skipSymbol('error')) {
                parser.skip(lexer.TOKEN_BLOCK_END);
                errorBody = parser.parseUntilBlocks(blockEnd);
            }

            parser.advanceAfterBlockEnd();

            // See above for notes about CallExtension
            return new nodes.CallExtension(this, 'run', args, [body, errorBody]);
        };

        this.run = function (context, url, body, errorBody) {
            var id = 'el' + Math.floor(Math.random() * 10000);
            var json = request('GET', url).getBody();
           // var obj = JSON.parse(ret);
           // var json = JSON.stringify(obj[0], null, '\t');
            console.log(json);
            return json;
        };
    }
}