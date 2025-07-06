(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('This example must run unsandboxed');
    }
//http://localhost:8000/pianoKeyboard.js
    class PianoKeyboard {
        static url = "";
        static eventsource = null;

        getInfo() {
            return {
                id: 'pianoKeyboardUnsandboxed',
                name: 'Piano Keyboard',
                blocks: [
                    {
                        blockType: Scratch.BlockType.EVENT,
                        opcode: 'whenPressed',
                        text: 'when [KEY] key pressed',
                        isEdgeActivated: false, // required boilerplate
                        arguments: {
                            KEY: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'key'
                            }
                        }
                    },
                    {
                        //blockType: Scratch.BlockType.BOOLEAN,
                        blockType: Scratch.BlockType.REPORTER,
                        opcode: 'connectPiano',
                        text: '[COMMAND] Piano at [URL]',
                        isEdgeActivated: false, // required boilerplate
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING
                            }
                            ,
                            COMMAND: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'pianoCommands'
                            }
                        }
                    }

                ],
                menus: {
                    key: {
                        acceptReporters: false,
                        items: [
                            {
                                // startHats filters by *value*, not by text
                                text: 'space',
                                value: ' '
                            },
                            'a',
                            'b',
                            'c',
                            // ...
                        ]
                    },
                    pianoCommands: {
                        acceptReporters: false,
                        items: [
                            'Start',
                            'Stop',
                            'Status'
                        ]
                    }
                }
            };
        }

        connectPiano(args) {
            let url = args.URL;
            if (args.COMMAND == 'Start') {
                url = url + "?mode=piano&start=true"
            } else if (args.COMMAND == 'Stop') {
                url = url + "?mode=piano&start=false"
            } else {
                throw new Error("Invalid command " + args.COMMAND);
            }
            return fetch(url)
                .then((response) => {
                    return response.text();
                })
                .catch((error) => {
                    console.error(error);
                    return 'Uh oh! Something went wrong.';
                });
        }
    }
    document.addEventListener('keydown', (e) => {
        Scratch.vm.runtime.startHats('eventexample2unsandboxed_whenPressed', {
            KEY: e.key
        });
    });

    Scratch.extensions.register(new PianoKeyboard());
})(Scratch);