//
//--// gist.github.com
//
//  the Gist API is not well documented although it seems stable enough, for now.
//
// http://develop.github.com/p/gist.html
//
var utils = {

    notify: function(message) {

        Components.classes['@mozilla.org/alerts-service;1'].
        getService(Components.interfaces.nsIAlertsService).
        showAlertNotification(null, 'Paster! says...', message, false, '', null);

    },

    copyText: function(str) {

        Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper).copyString(str);

    },

    openInBrowser: function(url) {

        ko.browse.openUrlInDefaultBrowser(url);

    },

    getSelection: function() {
        var view = ko.views.manager.currentView;
        var scimoz = view.scintilla.scimoz;


        var lineStart = scimoz.lineFromPosition(scimoz.selectionStart);
        var lineEnd = scimoz.lineFromPosition(scimoz.selectionEnd);



        var eolText = [];
        eolText[Components.interfaces.koIDocument.EOL_CR] = '\r';
        eolText[Components.interfaces.koIDocument.EOL_CRLF] = '\r\n';
        eolText[Components.interfaces.koIDocument.EOL_LF] = '\n';
        var newLineString = eolText[view.document.new_line_endings]

        var selectedText = "";
        if (scimoz.selectionMode == scimoz.SC_SEL_RECTANGLE) {

            var anchor = scimoz.lineFromPosition(scimoz.anchor);
            var curPos = scimoz.lineFromPosition(scimoz.currentPos);

            if (anchor > curPos) {
                lineStart = curPos;
                lineEnd = anchor;
            } else if (anchor < curPos) {
                lineStart = anchor;
                lineEnd = curPos;
            }


            for (var i = lineStart; i <= lineEnd; i++) {

                var selectionStart = scimoz.getLineSelStartPosition(i);
                var selectionEnd = scimoz.getLineSelEndPosition(i);
                selectedText += scimoz.getTextRange(selectionStart, selectionEnd);
                selectedText += newLineString;
            }
        } else {
            var selectionStart = scimoz.getLineSelStartPosition(lineStart);
            var selectionEnd = scimoz.getLineSelEndPosition(lineEnd);
            selectedText = scimoz.getTextRange(selectionStart, selectionEnd);
        }

        return selectedText;
    }



}


var gist = {

    post: function() {

        var selection = utils.getSelection();
        var text = encodeURIComponent(selection);
        var curLang = ko.views.manager.currentView.document.language;
        var fileName = ko.views.manager.currentView.document.file.baseName;
        var fileExt = fileName.split('.').pop();


        var httpReq = new XMLHttpRequest();

        httpReq.open("post", "http://gist.github.com/api/v1/json/new", false);
        httpReq.setRequestHeader("content-type", "application/x-www-form-urlencoded");

        var requestString = "file_ext={4}&description={1}&file_contents[gistfile1]={2}&file_name[gistfile1]={3}";
        var sendString = requestString.replace("{1}", "Pasted form Komodo IDE").replace("{2}", text).replace("{3}", fileName).replace("{4}", fileExt);


        httpReq.setRequestHeader("Content-length", sendString.length);
        httpReq.send(sendString);

        var res = httpReq.responseText;


        httpReq.setRequestHeader("Connection", "close");

        var json = JSON.parse(res);

        repo_id = json.gists[0].repo;

        var gist = 'https://gist.github.com/' + repo_id;

        utils.copyText(gist);

        utils.notify(gist + '  has been copied to the clipboard');

        utils.openInBrowser(gist);




    }


}

//
//--// Dpaste.org
//
var dpaste = {

    post: function() {
        var selection = utils.getSelection();
        var text = encodeURIComponent(selection);
        var title = ko.views.manager.currentView.document.file.baseName;

        var httpReq = new XMLHttpRequest();
        httpReq.open("post", "http://dpaste.org/api/", false);
        httpReq.setRequestHeader("content-type", "application/x-www-form-urlencoded");

        var requestString = "content={1}&title={2}";
        var sendString = requestString.replace("{1}", text).replace("{2}", title);

        httpReq.setRequestHeader("Content-length", sendString.length);
        httpReq.send(sendString);

        var url = this.getReturnURL(httpReq);
        httpReq.setRequestHeader("Connection", "close");

        url = url.substring(0, url.length - 1).replace(/^\s+|\s+$/g, "").replace('"', "");

        utils.copyText(url);
        utils.notify(url + '  has been copied to the clipboard');
        utils.openInBrowser(url);
    },

    getReturnURL: function(httpReq) {
        return httpReq.responseText;
    }
};

//
//--// pastebin.org
//
var pastebin = {

    post: function() {
        var selection = utils.getSelection();

        if (selection == "") {
            ko.dialogs.alert("No selection found");
            return;
        }

        var lang = encodeURIComponent(this.ko2pastebinLanguage());
        var text = encodeURIComponent(selection);
        var email = encodeURIComponent("");
        var nick = encodeURIComponent(ko.views.manager.currentView.document.file.baseName);
        var expiry = encodeURIComponent("1D"); // N = Never, 10M = 10 Minutes, 1H = 1 Hour, 1D = 1 Day, 1M = 1 Month
        var httpReq = new XMLHttpRequest();
        httpReq.open("post", "http://pastebin.com/api_public.php", false);
        httpReq.setRequestHeader("content-type", "application/x-www-form-urlencoded");

        var requestString = "paste_private=1&paste_format={1}&paste_code={2}&paste_email={3}&paste_name={4}&paste_expire_date={5}";
        var sendString = requestString.replace("{1}", lang).replace("{2}", text).replace("{3}", email).replace("{4}", nick).replace("{5}", expiry);
        httpReq.setRequestHeader("Content-length", sendString.length);
        httpReq.send(sendString);

        var url = this.getReturnURL(httpReq);
        httpReq.setRequestHeader("Connection", "close");

        utils.copyText(url);
        utils.notify(url + '  [ ' + lang + ' ] has been copied to the clipboard');
        utils.openInBrowser(url);
    },

    getReturnURL: function(httpReq) {
        return httpReq.responseText;
    },


    ko2pastebinLanguage: function() {
        var langMap = {};

        langMap["Text"] = "text";
        langMap["ActionScript"] = "actionscript";
        langMap["Ada"] = "ada";
        langMap["Apache"] = "apache";
        langMap["Assembler"] = "asm";
        langMap["Bash"] = "bash";
        langMap["C++"] = "c";
        langMap["C++"] = "cpp";
        langMap["CSS"] = "css";
        langMap["Diff"] = "diff";
        langMap["Eiffel"] = "eiffel";
        langMap["Fortran"] = "fortran";
        langMap["FreeBasic"] = "freebasic";
        langMap["HTML"] = "html4strict";
        langMap["Java"] = "java";
        langMap["JavaScript"] = "javascript";
        langMap["Lisp"] = "lisp";
        langMap["Lua"] = "lua";
        langMap["Matlab"] = "matlab";
        langMap["SQL"] = "mysql";
        langMap["Nsis"] = "nsis";
        langMap["PL-SQL"] = "oracle8";
        langMap["Pascal"] = "pascal";
        langMap["Perl"] = "perl";
        langMap["PHP"] = "php";
        langMap["Python"] = "python";
        langMap["Ruby"] = "ruby";
        langMap["Scheme"] = "scheme";
        langMap["Smarty"] = "smarty";
        langMap["SQL"] = "sql";
        langMap["Tcl"] = "tcl";
        langMap["VisualBasic"] = "vb";
        langMap["XBL"] = "xml";
        langMap["XML"] = "xml";
        langMap["XSLT"] = "xml";
        langMap["XUL"] = "xml";

        language = langMap[ko.views.manager.currentView.document.language];
        if (language == undefined) {
            return "text";
        }
        return language;
    }

};





///  The juice
///--------------
///
var pasterExtension = {

    onLoad: function() {
        window.controllers.appendController(this);
    },

    onUnload: function() {

        window.controllers.removeController(this);
    },

    pasteSelection: function() {

        var text = utils.getSelection();

        if (text == "") {

            utils.notify('you\'ll want to select some text first!');
            return;

        } else {

            prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("paster.");
            prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);


            symbol = prefs.getCharPref("symbol").toUpperCase();

            if (symbol == "PASTEBIN") pastebin.post();
            else if (symbol == "DPASTE") dpaste.post();
            else if (symbol == "GIST") gist.post();


        }

    },



    supportsCommand: function(cmd) {
        switch (cmd) {
        case "cmd_pasterSelection":
            return true;
        }
        return false;
    },

    isCommandEnabled: function(cmd) {
        // at startup with no file open manager is null
        var view = ko.views.manager && ko.views.manager.currentView;

        switch (cmd) {
        case "cmd_pasterSelection":
            if (view && view.getAttribute('type') == 'editor') {
                var scimoz = view.scintilla.scimoz;

                return scimoz.selectionStart != scimoz.selectionEnd;
            }
        }
        return false;
    },

    doCommand: function(cmd) {
        switch (cmd) {
        case "cmd_pasterSelection":
            this.pasteSelection();
            break;
        }
    },

    onEvent: function(evt) {}
};



var prefWatcher = {

    prefs: null,
    bin: "",

    // Initialize the extension
    startup: function() {
        // Register to receive notifications of preference changes
        this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("paster.");
        this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
        this.prefs.addObserver("", this, false);

        this.symbol = this.prefs.getCharPref("symbol").toUpperCase();

        this.refreshInformation();
        window.setInterval(this.refreshInformation, 10 * 60 * 1000);
    }

}

// DOM events attach
window.addEventListener("load", function(event) {
    pasterExtension.onLoad(event);
}, false);
window.addEventListener("unload", function(event) {
    pasterExtension.onUnLoad(event);
}, false);