module.exports = function(grunt) {
    grunt.initConfig({
        "jshint": {
            "files": ["Gruntfile.js", "js/*.js", "*.js"]
        },
        "watch": {
            "files": ["<%= jshint.files %>"],
            "tasks": ["jshint"]
        },
        "connect": {
            "dev": {
                "options": {
                    "port": 8080,
                    "base": ".",
                    "keepalive": true
                }
            }
        },
        "jsbeautifier": {
            "files": "<%= jshint.files %>",
            "options": {
                "indent_size": 4,
                "indent_char": " ",
                "indent_with_tabs": false
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib");
    grunt.loadNpmTasks("grunt-jsbeautifier");
};
