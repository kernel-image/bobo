function nullPointerErrorHandler(e) {
    const expectedMsg = 'null pointer passed to rust'
    if (e.message === expectedMsg) return
    else console.log(e)
}

export { nullPointerErrorHandler }