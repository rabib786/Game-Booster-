def close_callback(page, sockets):
    close_window()

if __name__ == '__main__':
    # Start the app. port=0 automatically selects an available port.
    eel.start('index.html', size=(1000, 650), port=0, close_callback=close_callback)
