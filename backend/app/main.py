from fastapi import FastAPI

app = FastAPI(title="OpsPilot Backend")


@app.get("/")
def root():
    return {"message": "OpsPilot Backend is running!"}