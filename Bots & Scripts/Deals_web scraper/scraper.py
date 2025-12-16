from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import warnings
import undetected_chromedriver as uc
warnings.filterwarnings("ignore", category=UserWarning, module="urllib3")

def get_coupons_grabon(url):
    options = Options()
    # options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36")
    driver = uc.Chrome(options=options)

    coupons = []

    try:
        driver.get(url)
        WebDriverWait(driver, 20).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.gcbr.go-cpn-show.go-cpy"))
        )

        coupon_cards = driver.find_elements(By.CSS_SELECTOR, "div.gcbr.go-cpn-show.go-cpy")
        for idx, card in enumerate(coupon_cards):
            try:
                # Find the SHOW COUPON CODE button
                show_btns = card.find_elements(By.XPATH, ".//div[contains(@class, 'visible-lg') and contains(text(), 'SHOW COUPON CODE')]")
                if not show_btns:
                    continue
                show_btn = show_btns[0]
                # Coupon code is the preceding sibling <span class="visible-lg">
                try:
                    code_elem = show_btn.find_element(By.XPATH, "./preceding-sibling::span[contains(@class, 'visible-lg')]")
                    code = code_elem.text.strip()
                except Exception:
                    code = "N/A"
                # Offer is in the parent <li> as <p>
                try:
                    parent_li = card.find_element(By.XPATH, "./ancestor::li")
                    offer_elem = parent_li.find_element(By.TAG_NAME, "p")
                    offer = offer_elem.text.strip()
                except Exception:
                    offer = "N/A"
                # Title: Try to get from <div class="coupon-title"> or fallback to offer
                try:
                    title_elem = parent_li.find_element(By.CSS_SELECTOR, ".coupon-title")
                    title = title_elem.text.strip()
                except Exception:
                    title = offer
                coupons.append({
                    "title": title,
                    "desc": offer,
                    "code": code
                })
            except Exception as e:
                print(f"Error extracting coupon {idx+1}: {e}")
                continue

        if coupons:
            print("\nAll Myntra Coupons from GrabOn:\n")
            for idx, c in enumerate(coupons, 1):
                print(f"{idx}. {c['title']}")
                print(f"   Offer: {c['desc']}")
                print(f"   Code: {c['code']}\n")
        else:
            print("No coupon codes found.")

    finally:
        try:
            driver.quit()
        except Exception:
            pass

if __name__ == "__main__":
    swiggy_coupon_url = "https://www.grabon.in/swiggy-coupons/"
    get_coupons_grabon(swiggy_coupon_url)