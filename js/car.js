// Car class - represents a vehicle that can be controlled manually or by AI
class Car{
    // Constructor initializes a car with position, dimensions, control type, and appearance
    constructor(x,y,width,height,controlType,maxSpeed=3,color="blue"){
        // Position properties
        this.x=x;
        this.y=y;
        // Dimensions of the car
        this.width=width;
        this.height=height;

        // Movement properties
        this.speed=0;
        this.acceleration=0.2;
        this.maxSpeed=maxSpeed;
        this.friction=0.05;
        this.angle=0;
        this.damaged=false; // Track if car has collided

        // Determine if car uses AI brain for autonomous driving
        this.useBrain=controlType=="AI";

        // Create sensor and neural network only for non-dummy cars
        if(controlType!="DUMMY"){
            this.sensor=new Sensor(this);
            // Neural network with input layer (sensor rays), hidden layer (6 neurons), output layer (4 controls)
            this.brain=new NeuralNetwork(
                [this.sensor.rayCount,6,4]
            );
        }
        // Controls object handles keyboard or AI inputs
        this.controls=new Controls(controlType);

        // Load car image
        this.img=new Image();
        this.img.src="../assets/car.png";

        // Create canvas mask for coloring the car
        this.mask=document.createElement("canvas");
        this.mask.width=width;
        this.mask.height=height;

        // Apply color tint to car image using canvas mask
        const maskCtx=this.mask.getContext("2d");
        this.img.onload=()=>{
            maskCtx.fillStyle=color;
            maskCtx.rect(0,0,this.width,this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation="destination-atop";
            maskCtx.drawImage(this.img,0,0,this.width,this.height);
        }
    }

    // Update car state: movement, sensor readings, and AI decision-making
    update(roadBorders,traffic){
        // Only update physics if car hasn't collided
        if(!this.damaged){
            this.#move();
            this.polygon=this.#createPolygon();
            this.damaged=this.#assessDamage(roadBorders,traffic);
        }
        // Update sensor readings and AI brain if sensor exists
        if(this.sensor){
            this.sensor.update(roadBorders,traffic);
            // Convert sensor readings to normalized offsets (0-1)
            const offsets=this.sensor.readings.map(
                s=>s==null?0:1-s.offset
            );
            // Pass sensor data through neural network to get control outputs
            const outputs=NeuralNetwork.feedForward(offsets,this.brain);

            // If using AI, update controls based on neural network outputs
            if(this.useBrain){
                this.controls.forward=outputs[0];
                this.controls.left=outputs[1];
                this.controls.right=outputs[2];
                this.controls.reverse=outputs[3];
            }
        }
    }

    // Check if car has collided with road borders or traffic
    #assessDamage(roadBorders,traffic){
        // Check collision with road boundaries
        for(let i=0;i<roadBorders.length;i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }
        // Check collision with other cars in traffic
        for(let i=0;i<traffic.length;i++){
            if(polysIntersect(this.polygon,traffic[i].polygon)){
                return true;
            }
        }
        return false;
    }

    // Create polygon representation of car for collision detection
    #createPolygon(){
        const points=[];
        // Calculate distance from center to corner
        const rad=Math.hypot(this.width,this.height)/2;
        // Calculate angle offset for each corner
        const alpha=Math.atan2(this.width,this.height);
        // Front-left corner
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });
        // Front-right corner
        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });
        // Back-left corner
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });
        // Back-right corner
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });
        return points;
    }

    // Handle car movement: acceleration, friction, rotation, and position updates
    #move(){
        // Apply acceleration or reverse based on control inputs
        if(this.controls.forward){
            this.speed+=this.acceleration;
        }
        if(this.controls.reverse){
            this.speed-=this.acceleration;
        }

        // Clamp speed to max values
        if(this.speed>this.maxSpeed){
            this.speed=this.maxSpeed;
        }
        if(this.speed<-this.maxSpeed/2){
            this.speed=-this.maxSpeed/2;
        }

        // Apply friction to slow car down
        if(this.speed>0){
            this.speed-=this.friction;
        }
        if(this.speed<0){
            this.speed+=this.friction;
        }
        // Stop car if speed is near zero
        if(Math.abs(this.speed)<this.friction){
            this.speed=0;
        }

        // Rotate car based on control inputs (only when moving)
        if(this.speed!=0){
            const flip=this.speed>0?1:-1;
            if(this.controls.left){
                this.angle+=0.03*flip;
            }
            if(this.controls.right){
                this.angle-=0.03*flip;
            }
        }

        // Update position based on current angle and speed
        this.x-=Math.sin(this.angle)*this.speed;
        this.y-=Math.cos(this.angle)*this.speed;
    }

    // Draw car on canvas with sensor visualization
    draw(ctx,drawSensor=false){
        // Draw sensor rays if enabled
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }

        // Save canvas state for transformations
        ctx.save();
        // Move to car position and rotate by car angle
        ctx.translate(this.x,this.y);
        ctx.rotate(-this.angle);
        // Draw car image; if not damaged, use color mask
        if(!this.damaged){
            ctx.drawImage(this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height);
            ctx.globalCompositeOperation="multiply";
        }
        // Draw base car image
        ctx.drawImage(this.img,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height);
        // Restore canvas state
        ctx.restore();

    }
}