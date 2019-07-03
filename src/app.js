const apigw = "https://pvli4gp5c8.execute-api.us-east-1.amazonaws.com/prod/streams/"
const clickstream = apigw + "ClickStream/record"

function recordClickEvent(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(event.clientX - rect.left)
    const y = Math.floor(event.clientY - rect.top)
    console.log("x: " + x + " y: " + y)
    const request = async () => {
        const response = await fetch(
            clickstream, {
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                method: 'PUT',
                body: JSON.stringify({"x": x, "y": y})
            }
        )
        const json = await response.json()
        console.log(json)
    }
    request();
}

const canvas = document.querySelector('#app-canvas')
canvas.addEventListener('click', function(e) {
    e.preventDefault()
    recordClickEvent(canvas, e)
})