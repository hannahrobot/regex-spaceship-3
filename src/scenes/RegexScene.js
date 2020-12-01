import Phaser from 'phaser';
import store from '../store';
import { fetchRandomTasks } from '../store/randomTasks';

export default class RegexScene extends Phaser.Scene {
  constructor() {
    super('RegexScene');
    this.state = {};
  }

  preload() {
    this.load.html('taskform', 'assets/text/taskform.html');
  }

  async create() {
    const scene = this;

    try {
      //sockets
      this.socket = io();
      await scene.socket.on('updateState', function (state) {
        scene.state = state;
        console.log('state is: ', scene.state)
      });
      if (!scene.state.randomTasks) {
        // console.log('getting 2 random tasks!!')
        await store.dispatch(fetchRandomTasks());
        const newState = store.getState();
        scene.socket.emit('sendState', newState);
        // console.log('2 tasks: ', scene.state.randomTasks)
      }

      
      // console.log('task 1: ', this.task1);
      // console.log('task 2: ', this.task2);

      scene.graphics = scene.add.graphics();
      scene.graphics2 = scene.add.graphics();
      
      // for popup window
      scene.graphics.lineStyle(1, 0xffffff);
      scene.graphics.fillStyle(0xffffff, 0.5);
      
      // for boxes
      scene.graphics2.lineStyle(1, 0xffffff);
      scene.graphics2.fillStyle(0xffffff, 1);
      
      // game windows: w: 800; h: 600
      // whole popup window: x, y, w, h
      
      // popup window
      scene.graphics.strokeRect(25, 25, 750, 550);
      scene.graphics.fillRect(25, 25, 750, 550);
      
      // regex problem prompt
      scene.graphics2.strokeRect(50, 50, 325, 450);
      scene.graphics2.fillRect(50, 50, 325, 450);
      scene.add.text(53, 35, 'Task Prompt', {
        fill: '#000000',
        fontSize: '20px',
        fontStyle: 'bold'
      });
      if (scene.state.randomTasks) {
        scene.task1 = scene.state.randomTasks[0].problem;
        scene.task2 = scene.state.randomTasks[1].problem;

        scene.add.text(55, 55, scene.task1, {
          fill: '#000000',
          fontSize: '20px',
          fontStyle: 'bold',
          align: "left",
          wordWrap: { width: 320, height: 445, useAdvancedWrap: true }
        });
      }
      
      // input area
      scene.graphics2.strokeRect(425, 50, 325, 225);
      scene.graphics2.fillRect(425, 50, 325, 225);
      scene.add.text(430, 35, 'Input', {
        fill: '#000000',
        fontSize: '20px',
        fontStyle: 'bold',
      });

      // output area
      scene.graphics2.strokeRect(425, 325, 325, 175);
      scene.graphics2.fillRect(425, 325, 325, 175);

      scene.add.text(430, 310, 'Output', {
        fill: '#000000',
        fontSize: '20px',
        fontStyle: 'bold',
      });

      scene.exit = scene.add.text(55, 525, 'Return', {
        fill: '#000000',
        fontSize: '30px',
        fontStyle: 'bold',
      });
      scene.exit.setInteractive();
      scene.exit.on('pointerdown', () => {
        scene.inputElement.setVisible(false);
        scene.scene.sleep('RegexScene');
      });

      scene.inputElement = scene.add.dom(587, 163).createFromCache('taskform');
      scene.outputText = scene.add.text(430, 330, 'temp', {
        fill: '#000000',
        fontSize: '20px',
        fontStyle: 'bold',
        align: "left",
        wordWrap: { width: 320, height: 445, useAdvancedWrap: true }
      });
      scene.outputText.setVisible(false);

      scene.submitButton = scene.add.text(642, 525, 'Submit', {
        fill: '#000000',
        fontSize: '30px',
        fontStyle: 'bold',
      });
      scene.submitButton.setInteractive();
      scene.submitButton.on('pointerdown', () => {
        const inputText = scene.inputElement.getChildByName('code');
        if (inputText.value !== '') {
          //console.log('input text:', inputText.value);
          scene.output = scene.handleInput(inputText.value);
          //console.log(scene.output);
          scene.outputText.setText(scene.output);
          scene.outputText.setVisible(true);

          scene.isCorrect = scene.add.text(320, 525, 'temp', {
            fill: '#000000',
            fontSize: '30px',
            fontStyle: 'bold',
            boundsAlignH: 'center'
          });
          scene.isCorrect.setVisible(false);
          if (inputText.value === 'potato') {
            scene.isCorrect.setText('Correct')
            scene.isCorrect.setVisible(true);
          } else {
            scene.isCorrect.setText('Incorrect')
            scene.isCorrect.setVisible(true);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
  handleInput(input) {
    return `expected: potato\nyours: ${input}`;
  }
}
