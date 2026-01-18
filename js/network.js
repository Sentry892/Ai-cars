// WARNING: this part is heavily documented since I want to explain neural networks well
// Also the only part where Ai wrote comments


// NeuralNetwork class
class NeuralNetwork{
    // Constructor creates layers (Levels) connecting neurons between consecutive layers
    // neuronCounts: array specifying neuron count for each layer (e.g., [5, 6, 4])
    constructor(neuronCounts){
        this.levels=[]; // Array of Level objects connecting layers
        // Create connections between each pair of consecutive layers
        for(let i=0;i<neuronCounts.length-1;i++){
            this.levels.push(new Level(
                neuronCounts[i],neuronCounts[i+1]
            ));
        }
    }

    // Forward propagation: pass inputs through all layers to get outputs
    // givenInputs: sensor data or previous layer outputs
    // network: the neural network to process through
    static feedForward(givenInputs,network){
        // Process inputs through first layer
        let outputs=Level.feedForward(
            givenInputs,network.levels[0]);
        // Process outputs through remaining layers
        for(let i=1;i<network.levels.length;i++){
            outputs=Level.feedForward(
                outputs,network.levels[i]);
        }
        return outputs; // Final network outputs (control signals)
    }

    // Mutation: randomly modify network weights and biases for genetic algorithm
    // network: the neural network to mutate
    // amount: mutation rate (0-1), controls how much to change weights
    static mutate(network,amount=1){
        // Iterate through all layers
        network.levels.forEach(level => {
            // Mutate biases (threshold values for each neuron)
            for(let i=0;i<level.biases.length;i++){
                level.biases[i]=lerp(
                    level.biases[i],
                    Math.random()*2-1,
                    amount
                )
            }
            // Mutate weights (connection strengths between neurons)
            for(let i=0;i<level.weights.length;i++){
                for(let j=0;j<level.weights[i].length;j++){
                    level.weights[i][j]=lerp(
                        level.weights[i][j],
                        Math.random()*2-1,
                        amount
                    )
                }
            }
        });
    }
}

// Level class - represents a single layer in the neural network
class Level{
    // Constructor creates a layer connecting inputCount neurons to outputCount neurons
    // inputCount: number of inputs (neurons from previous layer or sensors)
    // outputCount: number of outputs (neurons in this layer)
    constructor(inputCount,outputCount){
        // Store input values from previous layer
        this.inputs=new Array(inputCount);
        // Store output values after processing
        this.outputs=new Array(outputCount);
        // Bias values (thresholds) for each output neuron
        this.biases=new Array(outputCount);

        // Create weight matrix: weights[input][output]
        // Represents connection strength between input and output neurons
        this.weights=[];
        for(let i=0;i<inputCount;i++){
            this.weights[i]=new Array(outputCount);
        }

        // Initialize all weights and biases to random values
        Level.#randomize(this);
    }

    // Randomize all weights and biases to random values between -1 and 1
    static #randomize(level){
        // Initialize weight matrix with random values
        for(let i=0;i<level.inputs.length;i++){
            for(let j=0;j<level.outputs.length;j++){
                level.weights[i][j]=Math.random()*2-1;
            }
        }

        // Initialize biases with random values
        for(let i=0;i<level.biases.length;i++){
            level.biases[i]=Math.random()*2-1;
        }
    }

    // Forward propagation through one layer: calculate outputs from inputs
    // givenInputs: input values (sensor data or previous layer outputs)
    // level: the layer to process through
    static feedForward(givenInputs,level){
        // Store input values
        for(let i=0;i<level.inputs.length;i++){
            level.inputs[i]=givenInputs[i];
        }

        // Calculate output for each neuron in the layer
        for(let i=0;i<level.outputs.length;i++){
            // Sum weighted inputs for this neuron
            let sum=0
            for(let j=0;j<level.inputs.length;j++){
                sum+=level.inputs[j]*level.weights[j][i];
            }

            // Apply activation function: output is 1 if sum > bias, else 0
            // This is a simple threshold/step activation function
            if(sum>level.biases[i]){
                level.outputs[i]=1;
            }else{
                level.outputs[i]=0;
            } 
        }

        return level.outputs; // Return outputs to be used by next layer
    }
}