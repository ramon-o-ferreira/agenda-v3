from email_sender.actions import send_service_email

from time import sleep
from json import loads

from multiprocessing import Pool
from os import environ, cpu_count
from signal import signal, SIGINT, SIG_IGN

from redis import from_url

REDISCLOUD_URL = environ.get("REDISCLOUD_URL")
queue = from_url(f"{REDISCLOUD_URL}/services_queue")

if(__name__ == "__main__"):
    def init_worker():
        signal(SIGINT, SIG_IGN)

    WORKERS = int(environ.get("CPU_CORE_COUNT", cpu_count())) - 1
    with Pool(processes=WORKERS, initializer=init_worker) as workers:
        print(f"Workers: {WORKERS}")
        try:
            while(True):
                while(queue.exists("email_services")):
                    service = loads(queue.lpop("email_services").decode())

                    if(service["task"] == "send_service_email"):
                        data = service["data"]
                        workers.apply_async(send_service_email, (data,))

                # sleep(0.5)

        except KeyboardInterrupt:
            print("Encerrando Workers...")
        except Exception as e:
            print(e)
        finally:
            queue.close()
            workers.terminate()
            workers.join()