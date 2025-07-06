(function(Scratch) {
    'use strict';
  
    if (!Scratch.extensions.unsandboxed) {
      throw new Error('This example must run unsandboxed');
    }
  
    class WhenKeyPressed {
      getInfo() {
        return {
          id: 'eventexample2unsandboxed',
          name: 'Event Block Example 2',
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
            }
          }
        };
      }
    }
  
    document.addEventListener('keydown', (e) => {
      Scratch.vm.runtime.startHats('eventexample2unsandboxed_whenPressed', {
        KEY: e.key
      });
    });
  
    Scratch.extensions.register(new WhenKeyPressed());
  })(Scratch);