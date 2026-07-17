import subprocess

def run_git():
    try:
        # Run git log to check previous edits of .env file
        res = subprocess.run(["git", "log", "-p", "backend/.env"], capture_output=True, text=True, check=True)
        print("GIT LOG OUTPUT:")
        print(res.stdout)
    except Exception as e:
        print("Error running git log:", e)

    try:
        # Also run git status to check state
        res2 = subprocess.run(["git", "status"], capture_output=True, text=True, check=True)
        print("\nGIT STATUS:")
        print(res2.stdout)
    except Exception as e:
        print("Error running git status:", e)

if __name__ == "__main__":
    run_git()
