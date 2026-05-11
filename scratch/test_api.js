async function test() {
    const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token' // I need a real token or bypass auth
        },
        body: JSON.stringify({
            text: "Test post with images",
            images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
            video: "https://res.cloudinary.com/demo/video/upload/dog.mp4"
        })
    });
    const data = await response.json();
    console.log(data);
}
// test();
