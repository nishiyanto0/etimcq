const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('unit_4.json', 'utf8'));
  let count = 0;
  
  // Add the remaining detailed explanations from user's list
  const explanationsToAdd = [
    {
      question: "Immersive systems enhance which type of experience?",
      explanation: "Immersive systems enhance sensory experiences by engaging multiple senses (visual, auditory, haptic) to create a more realistic and engaging interaction with digital content, making users feel present in the virtual or augmented environment."
    },
    {
      question: "VR creates a:",
      explanation: "Virtual Reality (VR) creates a fully artificial, computer-generated environment that completely replaces the real world, immersing users in a simulated reality through headsets that block out the physical world."
    },
    {
      question: "VR users cannot see:",
      explanation: "VR users cannot see the real world because VR headsets completely cover their field of view with digital displays, isolating them from their physical surroundings to create full immersion in the virtual environment."
    },
    {
      question: "VR requires:",
      explanation: "VR requires a VR headset (Head-Mounted Display) which is the primary hardware component that displays the virtual environment to the user, tracks head movements, and creates an immersive experience by presenting stereoscopic 3D visuals."
    },
    {
      question: "VR is widely used in:",
      explanation: "VR is widely used in flight simulation because it provides a safe, cost-effective way to train pilots by recreating realistic flight conditions, emergency scenarios, and cockpit environments without the risks and costs associated with actual flight training."
    },
    {
      question: "AR enhances:",
      explanation: "Augmented Reality (AR) enhances the real world by overlaying digital content (images, text, 3D models) onto the physical environment in real-time, allowing users to see and interact with both real and virtual elements simultaneously."
    },
    {
      question: "AR works mainly through:",
      explanation: "AR works mainly through smartphones because they have built-in cameras, sensors, and processing power needed to capture the real world, overlay digital content, and display the augmented view, making AR accessible to billions of users without specialized hardware."
    },
    {
      question: "AR does NOT:",
      explanation: "AR does NOT replace the real world - instead, it supplements and enhances it by adding digital layers. Unlike VR which creates a completely virtual environment, AR maintains the user's connection to the physical world while adding digital information."
    },
    {
      question: "Pokémon GO is example of:",
      explanation: "Pokémon GO is an example of AR (Augmented Reality) because it overlays virtual Pokémon characters onto the real-world environment captured through the smartphone camera, allowing players to see and catch Pokémon in their actual physical surroundings."
    },
    {
      question: "MR combines:",
      explanation: "Mixed Reality (MR) combines elements of both VR and AR by merging the real and virtual worlds to create new environments where physical and digital objects coexist and interact in real-time, offering experiences that are more immersive than AR but less isolating than VR."
    },
    {
      question: "MR allows digital objects to:",
      explanation: "MR allows digital objects to interact with real objects in the physical environment. Unlike AR where digital objects are simply overlaid, MR enables virtual objects to understand and respond to the physical world, creating more realistic and interactive experiences."
    },
    {
      question: "XR stands for:",
      explanation: "XR stands for Extended Reality, which is an umbrella term that encompasses all immersive technologies including Virtual Reality (VR), Augmented Reality (AR), and Mixed Reality (MR), representing the full spectrum of the reality-virtuality continuum."
    },
    {
      question: "XR includes:",
      explanation: "XR (Extended Reality) includes all immersive technologies: VR (Virtual Reality), AR (Augmented Reality), and MR (Mixed Reality). It represents the complete spectrum from fully real to fully virtual environments."
    },
    {
      question: "Haptic technology provides:",
      explanation: "Haptic technology provides touch feedback by simulating the sense of touch through vibrations, forces, or motions. This allows users to feel virtual objects and interactions, enhancing realism and immersion in VR/AR experiences."
    },
    {
      question: "Haptic devices simulate:",
      explanation: "Haptic devices simulate touch sensations such as texture, pressure, vibration, and force. This tactile feedback makes virtual interactions feel more realistic, allowing users to 'feel' digital objects and enhancing the overall immersive experience."
    },
    {
      question: "VR improves understanding through:",
      explanation: "VR improves understanding through simulation by allowing users to experience and practice in safe, controlled virtual environments. This experiential learning is particularly effective for complex tasks, dangerous scenarios, or situations that are difficult to replicate in real life."
    },
    {
      question: "AR improves:",
      explanation: "AR improves access to real-time information by overlaying relevant data, instructions, or context directly onto the user's view of the physical world. This enables workers to access information hands-free while performing tasks, improving efficiency and accuracy."
    },
    {
      question: "MR is used in:",
      explanation: "MR is used in remote collaboration by allowing geographically dispersed teams to work together in shared virtual spaces where they can interact with 3D models, annotate real environments, and collaborate as if they were in the same physical location."
    },
    {
      question: "Immersive tech is used in:",
      explanation: "Immersive technology is used in all these sectors: Healthcare (surgery simulation, therapy), Education (interactive learning, virtual field trips), Gaming (immersive gameplay), and many other industries like manufacturing, real estate, and entertainment."
    },
    {
      question: "VR in healthcare is mainly used for:",
      explanation: "VR in healthcare is mainly used for surgery simulation, allowing surgeons to practice complex procedures in a risk-free virtual environment. This improves surgical skills, reduces errors, and enables training on rare or complex cases without endangering patients."
    },
    {
      question: "VR helps in dangerous training because it is:",
      explanation: "VR helps in dangerous training because it is risk-free - trainees can practice hazardous scenarios like firefighting, military combat, or emergency response in a completely safe virtual environment where mistakes have no real-world consequences."
    },
    {
      question: "AR navigation displays:",
      explanation: "AR navigation displays digital directions overlaid on the real-world view, showing arrows, street names, and points of interest directly in the user's field of view. This makes navigation more intuitive than looking at a separate map or screen."
    },
    {
      question: "Immersive tech improves:",
      explanation: "Immersive tech improves industrial safety by allowing workers to train on dangerous equipment and scenarios in virtual environments, visualize hazards before they occur, and receive real-time safety information through AR overlays while working."
    },
    {
      question: "VR tourism allows:",
      explanation: "VR tourism allows virtual tours of destinations, museums, and landmarks from anywhere in the world. Users can explore places remotely, which is useful for previewing destinations, accessing inaccessible locations, or experiencing places they cannot physically visit."
    },
    {
      question: "MR uses:",
      explanation: "MR uses sensors and cameras to understand the physical environment, track user movements, detect surfaces and objects, and enable digital content to interact realistically with the real world. These technologies are essential for spatial awareness and interaction."
    },
    {
      question: "VR gaming requires:",
      explanation: "VR gaming requires an immersive headset that provides stereoscopic 3D visuals, head tracking, and often hand controllers. This hardware creates a sense of presence and allows players to interact naturally with the virtual game environment."
    },
    {
      question: "AR product visualization helps in:",
      explanation: "AR product visualization helps in marketing by allowing customers to see how products would look in their real environment before purchasing. For example, furniture retailers let customers visualize how a sofa would look in their living room, increasing confidence in purchase decisions."
    },
    {
      question: "XR offers:",
      explanation: "XR offers flexible immersive solutions that can be tailored to specific needs by combining elements of VR, AR, and MR. Organizations can choose the right level of immersion and interaction for their use case, from simple AR overlays to fully immersive VR experiences."
    },
    {
      question: "Haptic feedback enhances:",
      explanation: "Haptic feedback enhances realism in immersive experiences by providing tactile sensations that match visual and auditory cues. When you 'touch' a virtual object and feel resistance or texture, the experience becomes more convincing and engaging."
    }
  ];
  
  // Find and update matching questions
  explanationsToAdd.forEach(item => {
    const index = data.questions.findIndex(q => 
      q.question === item.question && 
      q.explanation && 
      q.explanation.includes('follows standard concepts covered in this unit')
    );
    
    if (index !== -1) {
      data.questions[index].explanation = item.explanation;
      count++;
      console.log(`Updated explanation for: ${item.question}`);
    }
  });
  
  if (count > 0) {
    fs.writeFileSync('unit_4.json', JSON.stringify(data, null, 2));
    console.log(`Total updated: ${count} explanations`);
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
