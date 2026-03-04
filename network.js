class NeuralNetwork {
    constructor(neuronCounts) {
        this.levels = [];
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
        }
    }

    static feedForward(inputs, network) {
        let outputs = inputs;
        for (let i = 0; i < network.levels.length; i++) {
            outputs = Level.feedForward(outputs, network.levels[i]);
        }
        return outputs;
    }

    static mutate(network, mutationRate = 0.1) {
        for (let i = 0; i < network.levels.length; i++) {
            for (let j = 0; j < network.levels[i].weights.length; j++) {
                for (let k = 0; k < network.levels[i].weights[j].length; k++) {
                    if (Math.random() < mutationRate) {
                        network.levels[i].weights[j][k] += Math.random() * 2 - 1;
                    }
                }
            }
        }
    }
}

class Level {
    constructor(inputCount, outputCount) {
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);

        this.weights = [];
        for (let i = 0; i < inputCount; i++) {
            this.weights[i] = new Array(outputCount);
        }

        Level.#initWeights(this);
    }

    static #initWeights(level) {
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        }

        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = Math.random() * 2 - 1;
        }
    }

    static feedForward(input, level) {
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = input[i];
        }

        for (let i = 0; i < level.outputs.length; i++) {
            let sum = level.biases[i];
            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j] * level.weights[j][i];
            }
            level.outputs[i] = sum;
        }

        return level.outputs;
    }
}
