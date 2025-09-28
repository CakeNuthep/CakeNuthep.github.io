import {Box} from './Box.js';
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

class DanceObject extends Box {
    constructor({
            name,
            width,
            height,
            depth,
            position,
            title = 'Dance Area',
            details = {},
            link = null
            
        }) {
        super({
            name,
            width,
            height,
            depth,
            position: new THREE.Vector3(0, 0, 0),
            isCollition: true,
            passThroughWhenCollision: true,
        });
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.title = title;
        this.details = details;
        this.link = link;
        this.model = this.setupInteractiveCube(position);
        this.model.add(this.cube);
        this.animateDuration = 8000;
    }

    setupInteractiveCube(position) {
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x005733,
            metalness: 0.5,
            roughness: 0.7,
            transparent: true,
            opacity: 0
        });
        const cube = new THREE.Mesh(geometry, material);


        cube.position.set(position.x, position.y, position.z);
    
        // Create the top-level container div
        const holdContainer = document.createElement('div');
        holdContainer.classList.add('hold-container');

        const subContainer = document.createElement('div');
        subContainer.classList.add('sub-container');
        subContainer.style.width = '6vw';
        subContainer.style.height = '6vw';
        subContainer.style.display = 'none'; // Initially hidden
        holdContainer.appendChild(subContainer);


        // Create the button element
        const holdButton = document.createElement('button');
        holdButton.id = 'hold-button';

        // Create the progress circle div
        const progressCircle = document.createElement('div');
        progressCircle.classList.add('progress-circle');

        // Create the span for the button text
        const buttonText = document.createElement('span');
        buttonText.classList.add('button-text');
        buttonText.textContent = 'Hold E';

        // Append the inner elements to the button
        holdButton.append(progressCircle, buttonText);

        // Append the button to the main container
        subContainer.append(holdButton);
        const labelDetails = this.createLabelDetails(this.title, this.details, this.link);
        subContainer.append(labelDetails);

        // Append the final element to the document body or another container
        this.setHtmlElement(subContainer)
    
        const label = new CSS2DObject(holdContainer);
        label.position.set(0, this.height+1, 0);
        cube.add(label);

        
        


        cube.position.set(position.x, position.y, position.z);
        return cube;
    } 

    update() {
        this.updateSides();
    }

    playAnimateHtml(elapsedTime){
        const html = this.getHtmlElement();
        if(html)
        {
            const buttonHold = html.querySelector('#hold-button');
            if (!buttonHold.classList.contains('completed'))
            {
                const progressCircle = buttonHold.querySelector('.progress-circle');
                const buttonText = buttonHold.querySelector('.button-text');
                buttonHold.classList.remove('completed');
                buttonText.textContent = '...';

                
                const progress = Math.min(100, (elapsedTime / this.animateDuration) * 100);
                
                progressCircle.style.background = `conic-gradient(#007bff ${progress}%, transparent ${progress}%)`;

                if (progress >= 100) {
                    buttonHold.classList.add('completed');
                    buttonText.textContent = 'Done!';
                }
            }
        }
    }

    stopAnimateHtml(){
        const html = this.getHtmlElement();
        if(html)
        {
            const buttonHold = html.querySelector('#hold-button');
            const progressCircle = buttonHold.querySelector('.progress-circle');
            const buttonText = buttonHold.querySelector('.button-text');
            progressCircle.style.background = 'conic-gradient(transparent 0%, transparent 0%)';
            if (!buttonHold.classList.contains('completed')) {
                buttonText.textContent = 'Hold E';
            }
        }
    }

    // popup details regarding Title, Position Name, year start , year end, description, link more details
    // detail is besinde the hold button
    createLabelDetails(tile, details, link) {
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('details-container');
        detailsContainer.style.marginTop = '10px';
        detailsContainer.style.border = '1px solid #ccc';
        detailsContainer.style.borderRadius = '5px';
        // set background color white with opacity 0.8
        detailsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        detailsContainer.style.padding = '10px';

        //text fit to container
        detailsContainer.style.boxSizing = 'border-box';
        detailsContainer.style.maxWidth = '200px';
        detailsContainer.style.fontSize = '1vw';
        detailsContainer.style.color = '#000';
        detailsContainer.style.fontFamily = 'Arial, sans-serif';

        // set position beside the hold button
        detailsContainer.style.position = 'absolute';
        detailsContainer.style.top = '0';
        detailsContainer.style.left = '110%';

        const titleElem = document.createElement('h3');
        titleElem.textContent = tile;
        detailsContainer.appendChild(titleElem);

        //add line between title and details
        const line = document.createElement('hr');
        detailsContainer.appendChild(line);

        for (const key in details) {
            const detailElem = document.createElement('p');

            // bold the key
            detailElem.innerHTML = `<strong>${key}:</strong> ${details[key]}`;
            detailsContainer.appendChild(detailElem);
        }
        if (link) {
            const linkElem = document.createElement('a');
            linkElem.className = 'link-label';
            linkElem.href = link;
            linkElem.textContent = 'More Details';
            linkElem.target = '_blank';
            detailsContainer.appendChild(linkElem);
        }
        return detailsContainer;
    }
}

export { DanceObject };