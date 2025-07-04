import time
import pandas as pd
import os
import asyncio
import random
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
import logging
from logging.handlers import TimedRotatingFileHandler
from selenium.webdriver.common.action_chains import ActionChains
from datetime import datetime, timedelta, timezone
import json

# ==============================================================================
# --- CONSTANTS ---
# ==============================================================================
BASE_FOLDER2 = r"C:\Users\Nilton\Desktop\Fareja\CP"
BASE_FOLDER3 = r"C:\Users\Nilton\Desktop\Fareja\CP3"
BASE_FOLDER = r"C:\Users\Nilton\Desktop\Fareja"
FOLDER_SOURCE = os.path.join(BASE_FOLDER, "Source\\")
FOLDER_MAIN = os.path.join(BASE_FOLDER, "Main\\")
FOLDER_QUEUE = os.path.join(BASE_FOLDER, "Queue\\")
FOLDER_LOGS = os.path.join(BASE_FOLDER, "Logs\\")
CHROME_PROFILE_PATH = os.path.join(BASE_FOLDER3, "ChromeProfile")
EXCLUDE_FILE = "gafanhoto.xlsx"
CHROMEDRIVER_PATH = r'C:\Users\Nilton\Desktop\Chromedriver\chromedriver-win64\chromedriver.exe'
MESSAGE_BOX_XPATH = '//div[@contenteditable="true"][@data-tab="10"]'

# API Configuration
API_BASE_URL = "http://localhost:3000"
API_SECRET_KEY = "farejai-secure-2024-admin-key"
API_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_SECRET_KEY}"
}

# ==============================================================================
# --- WHATSAPP GROUP FORWARDING RULES ---
# ==============================================================================
FILE_TO_GROUP_MAPPING = {
    "pechinchou-recentes.xlsx": [
        "Fareja.ai - Promoções #56",
        "Fareja.ai - Promoções #57",
        "Fareja.ai - Promoções #58",
        "Fareja.ai - Promoções #21"
    ],
    "pechinchou-informática.xlsx": ["Fareja.ai - Tech #19"],
    "pechinchou-games.xlsx": ["Fareja.ai - Tech #19"],
    "pechinchou-smartphone.xlsx": ["Fareja.ai - Tech #19", "Fareja.ai - Smartphone #21"],
    "pechinchou-SmartTV.xlsx": ["Fareja.ai - Tech #19", "Fareja.ai - Smart-TV #44"],
    "pechinchou-bebidas.xlsx": ["Fareja.ai - Bebidas #55", "Fareja.ai - Supermercado #71"]
}

# ==============================================================================
# --- SETUP LOGGING ---
# ==============================================================================
if not os.path.exists(FOLDER_LOGS):
    os.makedirs(FOLDER_LOGS)
if not os.path.exists(FOLDER_QUEUE):
    os.makedirs(FOLDER_QUEUE)

log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_file = os.path.join(FOLDER_LOGS, 'whatsapp_promotions_log.txt')
file_handler = TimedRotatingFileHandler(log_file, when="midnight", interval=1, backupCount=7, encoding='utf-8')
file_handler.setFormatter(log_formatter)
file_handler.suffix = "%Y-%m-%d"
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger = logging.getLogger()
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

# Expected columns for dataframes
ALL_EXPECTED_COLUMNS = [
    'TITLE', 'STORE', 'Cupom', 'SALE_DATE', 'DE', 'PRICE', 'Link',
    'freight', 'FLAG', 'FINAL_LINK', 'DONE', 'SCRAP_DATE',
    'FINAL_LINK_CONVERTED_ATTEMPTED', 'DONE_WHATSAPP'
]

# ==============================================================================
# --- UTILITY FUNCTIONS ---
# ==============================================================================
def ensure_dataframe_columns(df):
    """Ensure all expected columns exist in the dataframe"""
    for col in ALL_EXPECTED_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA
    return df

def format_price(price):
    """Format price to have 2 decimal places"""
    try:
        if pd.isna(price) or price == '' or str(price).lower() == 'nan':
            return '0.00'
        price_float = float(str(price).replace(',', '.'))
        return f"{price_float:.2f}"
    except (ValueError, TypeError):
        return '0.00'

def is_recent_scrape(scrap_date):
    """Check if the scrap_date is within the last 30 minutes"""
    try:
        if pd.isna(scrap_date):
            return False
        
        # Parse the scrap date
        if isinstance(scrap_date, str):
            scrap_datetime = pd.to_datetime(scrap_date)
        else:
            scrap_datetime = scrap_date
        
        # Make it timezone aware if it's not
        if scrap_datetime.tzinfo is None:
            scrap_datetime = scrap_datetime.replace(tzinfo=timezone.utc)
        
        # Get current time
        current_time = datetime.now(timezone.utc)
        
        # Check if within last 30 minutes
        time_diff = current_time - scrap_datetime
        return time_diff <= timedelta(minutes=30)
    except Exception as e:
        logger.error(f"Error checking scrap date: {e}")
        return False

def create_whatsapp_message(row):
    """Creates a WhatsApp message based on the row data."""
    message = "🚨*Farejei outra Promo!*🚨\n"

    title = row.get('TITLE', 'N/A')
    message += f"{title}\n"

    # Handle DE_VALUE (send the value as is if it's not empty)
    de = row.get('DE', '')
    if de and str(de).strip() != '' and str(de).lower() != 'nan':
        de_formatted = format_price(de)
        message += f"\n❌ ~De: R$ {de_formatted}~"

    price = row.get('PRICE', 'N/A')
    price_formatted = format_price(price)
    message += f"\n🔥 *Por: R$ {price_formatted}*\n"

    # Handle Cupom (only include the line if Cupom is not empty)
    cupom = row.get('Cupom', '')
    if cupom and str(cupom).strip() != '' and str(cupom).lower() != 'nan':
        message += f"🎟️ *Cupom: {cupom}*\n"

    url4 = row.get('FINAL_LINK', 'N/A')
    if pd.isna(url4) or url4 == 'nan' or url4 == 'N/A':
        message += f"🛒 *Link:* N/A\n"
        message += f"🛍️ *Loja:* Desconhecida\n"
    else:
        message += f"🛒 *Link:* {url4}\n"
        store = row.get('STORE', '').lower()
        if 'amazon' in store or 'amazon' in url4.lower():
            message += f"🛍️ *Loja:* Amazon\n"
        elif 'mercado' in store or 'mercadolivre' in url4.lower():
            message += f"🛍️ *Loja:* Mercado Livre\n"
        elif 'magazinevoce' in url4.lower():
            message += f"🛍️ *Loja:* Magalu\n"
        else:
            message += f"🛍️ *Loja:* Outra Loja\n"

    message += "\n*🟢 Link do Grupo Whats:"
    message += "\nhttps://chat.whatsapp.com/EIrN3j3ndMH6SV3pCWDfJz"
    message += "\n*🌎 Site c/ tds as Promos*"
    message += "\nhttps://fareja.ai"
    message += "\n*📷 Instagram*"
    message += "\nhttps://www.instagram.com/fareja.ai/"

    return message

# ==============================================================================
# --- API INTEGRATION ---
# ==============================================================================
def create_promotion_via_api(row):
    """Create a promotion via API and return the final link"""
    try:
        logger.info(f"API REQUEST: Creating promotion for '{row.get('TITLE', 'N/A')}'")
        
        # Prepare the data for API
        api_data = {
            "title": str(row.get('TITLE', '')).strip(),
            "price": float(format_price(row.get('PRICE', 0))),
            "price_from": float(format_price(row.get('DE', 0))) if row.get('DE') and str(row.get('DE')).strip() != '' else None,
            "storeName": str(row.get('STORE', '')).strip(),
            "affiliateLink": str(row.get('Link', '')).strip(),
            "coupon": str(row.get('Cupom', '')).strip() if row.get('Cupom') and str(row.get('Cupom')).strip() != '' else None
        }
        
        logger.info(f"API DATA: {api_data}")
        
        # Make API request
        response = requests.post(
            f"{API_BASE_URL}/api/promotions",
            json=api_data,
            headers=API_HEADERS,
            timeout=30
        )
        
        if response.status_code == 201:
            result = response.json()
            final_link = result.get('siteLink')
            logger.info(f"API SUCCESS: Created promotion with link: {final_link}")
            return final_link
        else:
            logger.error(f"API ERROR: Failed to create promotion. Status: {response.status_code}, Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"API REQUEST ERROR: {e}")
        return None
    except Exception as e:
        logger.error(f"API GENERAL ERROR: {e}")
        return None

# ==============================================================================
# --- WHATSAPP FUNCTIONS ---
# ==============================================================================
def initialize_whatsapp_web():
    """Initialize WhatsApp Web with Chrome"""
    try:
        logger.info("WHATSAPP INIT: Initializing WhatsApp WebDriver...")
        options = Options()
        options.add_argument(f"user-data-dir={CHROME_PROFILE_PATH}")
        options.add_argument("start-maximized")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        service = Service(CHROMEDRIVER_PATH)
        driver = webdriver.Chrome(service=service, options=options)
        driver.get("https://web.whatsapp.com")
        
        try:
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, "//div[@contenteditable='true'][@data-tab='3']"))
            )
            logger.info("WHATSAPP INIT: WhatsApp session restored from Chrome profile. No QR scan needed.")
        except TimeoutException:
            logger.info("WHATSAPP INIT: Not logged in. Please scan the QR code to log into WhatsApp Web.")
            input("Press Enter after logging into WhatsApp Web...")
            logger.info("WHATSAPP INIT: WhatsApp Logged in successfully.")
        return driver
    except Exception as e:
        logger.error(f"WHATSAPP INIT ERROR: Failed to initialize WhatsApp WebDriver: {e}", exc_info=True)
        return None

def switch_chat_via_ui(driver, group_name):
    """Switch to a specific group chat"""
    try:
        logger.info(f"WHATSAPP CHAT: Switching to group '{group_name}'...")
        search_box_xpath = "//div[@contenteditable='true'][@data-tab='3']"
        search_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, search_box_xpath))
        )
        ActionChains(driver).move_to_element(search_box).click().key_down(Keys.CONTROL).send_keys("a").key_up(
            Keys.CONTROL).send_keys(Keys.BACK_SPACE).perform()
        search_box.send_keys(group_name)
        time.sleep(random.uniform(1, 2))
        
        group_xpath = f"//span[@title='{group_name}']"
        group_element = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, group_xpath))
        )
        group_element.click()
        
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, MESSAGE_BOX_XPATH))
        )
        logger.info(f"WHATSAPP CHAT: Successfully switched to group '{group_name}'.")
        return True
    except TimeoutException:
        logger.error(f"WHATSAPP CHAT ERROR: Timeout while switching to group '{group_name}'.")
        ActionChains(driver).send_keys(Keys.ESCAPE).perform()
        return False
    except Exception as e:
        logger.error(f"WHATSAPP CHAT ERROR: Failed to switch to group '{group_name}': {e}", exc_info=True)
        ActionChains(driver).send_keys(Keys.ESCAPE).perform()
        return False

def send_whatsapp_message(driver, message):
    """Send a message to the currently active WhatsApp chat"""
    try:
        logger.info("WHATSAPP SEND: Sending message...")
        message_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, MESSAGE_BOX_XPATH))
        )
        message_box.send_keys(message)
        
        # Wait for preview to load
        logger.info("WHATSAPP SEND: Waiting for preview to load...")
        time.sleep(10)  # Wait for preview to load
        
        # Send the message
        message_box.send_keys(Keys.ENTER)
        logger.info("WHATSAPP SEND: Message sent successfully.")
        return True
    except Exception as e:
        logger.error(f"WHATSAPP SEND ERROR: Failed to send message: {e}", exc_info=True)
        return False

def send_message_to_groups(driver, message, target_groups):
    """Send message to multiple WhatsApp groups"""
    logger.info(f"WHATSAPP GROUPS: Sending message to {len(target_groups)} groups")
    success_count = 0
    
    for group_name in target_groups:
        try:
            if switch_chat_via_ui(driver, group_name):
                if send_whatsapp_message(driver, message):
                    logger.info(f"WHATSAPP SUCCESS: Message sent to group '{group_name}'")
                    success_count += 1
                else:
                    logger.error(f"WHATSAPP FAIL: Failed to send message to group '{group_name}'")
            else:
                logger.error(f"WHATSAPP FAIL: Failed to switch to group '{group_name}'")
            
            # Random delay between messages
            delay = random.uniform(8, 20)
            logger.info(f"WHATSAPP DELAY: Waiting {delay:.1f} seconds before next message...")
            time.sleep(delay)
            
        except Exception as e:
            logger.error(f"WHATSAPP ERROR: Error sending to group '{group_name}': {e}", exc_info=True)
    
    logger.info(f"WHATSAPP SUMMARY: Successfully sent to {success_count}/{len(target_groups)} groups")
    return success_count > 0

# ==============================================================================
# --- MAIN PROCESSING LOGIC ---
# ==============================================================================
async def process_single_promotion(row):
    """Process a single promotion by creating it via API"""
    try:
        original_link = str(row.get('Link', '')).strip()
        store = str(row.get('STORE', '')).strip().lower()
        
        # Only process Amazon and Mercado Livre
        if not ('amazon' in store or 'mercado' in store):
            logger.warning(f"STORE FILTER: Skipping unsupported store '{store}' for product '{row.get('TITLE', 'N/A')}'")
            return None
        
        # Skip bit.ly links
        if "bit.ly" in original_link.lower():
            logger.warning(f"LINK FILTER: Skipping bit.ly link: {original_link}")
            return None
        
        logger.info(f"PROMOTION PROCESS: Processing '{row.get('TITLE', 'N/A')}' from '{store}'")
        
        # Create promotion via API
        final_link = create_promotion_via_api(row)
        
        if final_link:
            logger.info(f"PROMOTION SUCCESS: Got final link: {final_link}")
            return final_link
        else:
            logger.error(f"PROMOTION FAIL: Failed to create promotion for '{row.get('TITLE', 'N/A')}'")
            return None
            
    except Exception as e:
        logger.error(f"PROMOTION ERROR: Error processing promotion: {e}", exc_info=True)
        return None

async def file_processing_worker(driver):
    """Main file processing worker"""
    logger.info("FILE WORKER: Starting file processing worker...")
    
    while True:
        try:
            logger.info("--- FILE PROCESSING: Starting new iteration ---")
            
            for filename in os.listdir(FOLDER_SOURCE):
                if not filename.endswith(".xlsx") or filename.startswith('~') or filename == EXCLUDE_FILE:
                    continue

                target_groups = FILE_TO_GROUP_MAPPING.get(filename)
                if not target_groups:
                    continue

                logger.info(f"FILE PROCESSING: Processing file: {filename}")
                
                source_path = os.path.join(FOLDER_SOURCE, filename)
                queue_path = os.path.join(FOLDER_QUEUE, filename)
                main_path = os.path.join(FOLDER_MAIN, filename)

                # Load source file
                try:
                    source_df = pd.read_excel(source_path)
                    source_df = ensure_dataframe_columns(source_df)
                except Exception as e:
                    logger.error(f"FILE ERROR: Could not read source file {source_path}: {e}")
                    continue

                # Load queue file
                try:
                    if os.path.exists(queue_path):
                        queue_df = pd.read_excel(queue_path)
                        queue_df = ensure_dataframe_columns(queue_df)
                    else:
                        queue_df = pd.DataFrame(columns=ALL_EXPECTED_COLUMNS)
                except Exception as e:
                    logger.error(f"FILE ERROR: Could not read queue file {queue_path}: {e}")
                    queue_df = pd.DataFrame(columns=ALL_EXPECTED_COLUMNS)

                # Load main file
                try:
                    if os.path.exists(main_path):
                        main_df = pd.read_excel(main_path)
                        main_df = ensure_dataframe_columns(main_df)
                    else:
                        main_df = pd.DataFrame(columns=ALL_EXPECTED_COLUMNS)
                except Exception as e:
                    logger.error(f"FILE ERROR: Could not read main file {main_path}: {e}")
                    main_df = pd.DataFrame(columns=ALL_EXPECTED_COLUMNS)

                # Filter new deals from last 30 minutes
                new_deals = source_df[
                    (source_df['FLAG'].astype(str).str.upper() == 'NEW') &
                    (source_df['SCRAP_DATE'].apply(is_recent_scrape))
                ].copy()

                if not new_deals.empty:
                    logger.info(f"FILE PROCESSING: Found {len(new_deals)} new recent deals in {filename}")
                    
                    # Create unique keys for deduplication
                    new_deals['UNIQUE_KEY'] = new_deals['TITLE'].astype(str) + new_deals['SALE_DATE'].astype(str)
                    
                    existing_keys = set()
                    if not queue_df.empty:
                        queue_df['UNIQUE_KEY'] = queue_df['TITLE'].astype(str) + queue_df['SALE_DATE'].astype(str)
                        existing_keys.update(queue_df['UNIQUE_KEY'])
                    if not main_df.empty:
                        main_df['UNIQUE_KEY'] = main_df['TITLE'].astype(str) + main_df['SALE_DATE'].astype(str)
                        existing_keys.update(main_df['UNIQUE_KEY'])

                    # Filter truly new deals
                    truly_new_deals = new_deals[~new_deals['UNIQUE_KEY'].isin(existing_keys)]

                    if not truly_new_deals.empty:
                        logger.info(f"FILE PROCESSING: Adding {len(truly_new_deals)} unique new deals to queue")
                        queue_df = pd.concat([queue_df, truly_new_deals], ignore_index=True)
                        queue_df.drop(columns=['UNIQUE_KEY'], errors='ignore').to_excel(queue_path, index=False)

                # Process items from queue
                if not queue_df.empty:
                    deals_to_process = queue_df[queue_df['DONE_WHATSAPP'] != 'YES'].copy()
                    
                    if not deals_to_process.empty:
                        logger.info(f"FILE PROCESSING: Processing {len(deals_to_process)} deals from queue")
                        
                        indices_to_remove = []
                        newly_processed = []
                        
                        for index, row in deals_to_process.iterrows():
                            logger.info(f"DEAL PROCESSING: Processing '{row.get('TITLE', 'N/A')}'")
                            
                            final_link = await process_single_promotion(row)
                            processed_row = row.copy()
                            
                            if final_link:
                                processed_row['FINAL_LINK'] = final_link
                                processed_row['DONE'] = 'YES'
                                
                                # Create WhatsApp message
                                message = create_whatsapp_message(processed_row)
                                
                                # Send to WhatsApp groups
                                if send_message_to_groups(driver, message, target_groups):
                                    processed_row['FLAG'] = 'SENT'
                                    processed_row['DONE_WHATSAPP'] = 'YES'
                                    indices_to_remove.append(index)
                                    newly_processed.append(processed_row)
                                    logger.info(f"DEAL SUCCESS: '{row.get('TITLE', 'N/A')}' sent to WhatsApp groups")
                                else:
                                    processed_row['FLAG'] = 'API_SUCCESS_WHATSAPP_FAIL'
                                    processed_row['DONE_WHATSAPP'] = 'NO_SEND_FAILED'
                                    queue_df.loc[index] = processed_row
                                    logger.error(f"DEAL FAIL: WhatsApp send failed for '{row.get('TITLE', 'N/A')}'")
                            else:
                                processed_row['FLAG'] = 'API_FAILED'
                                processed_row['DONE'] = 'NO'
                                processed_row['DONE_WHATSAPP'] = 'NO_API_FAILED'
                                queue_df.loc[index] = processed_row
                                logger.error(f"DEAL FAIL: API creation failed for '{row.get('TITLE', 'N/A')}'")
                        
                        # Update files
                        if newly_processed:
                            # Add to main file
                            newly_processed_df = pd.DataFrame(newly_processed)
                            main_df_updated = pd.concat([main_df.drop(columns=['UNIQUE_KEY'], errors='ignore'), newly_processed_df], ignore_index=True)
                            main_df_updated.to_excel(main_path, index=False)
                            logger.info(f"FILE HISTORY: Added {len(newly_processed)} processed deals to history")
                            
                            # Remove from queue
                            queue_df = queue_df.drop(indices_to_remove)
                        
                        # Save queue
                        queue_df.to_excel(queue_path, index=False)
                        logger.info(f"FILE QUEUE: Updated queue. Remaining items: {len(queue_df)}")
                else:
                    logger.info(f"FILE PROCESSING: No items in queue for {filename}")

            logger.info("--- FILE PROCESSING: Completed iteration ---")
            
        except Exception as e:
            logger.error(f"FILE WORKER ERROR: {e}", exc_info=True)
        
        # Wait 5 seconds before next iteration
        await asyncio.sleep(5)

# ==============================================================================
# --- MAIN FUNCTION ---
# ==============================================================================
async def main():
    """Main function"""
    whatsapp_driver = None
    try:
        logger.info("MAIN: Starting WhatsApp Promotions Script...")
        
        # Initialize WhatsApp
        whatsapp_driver = initialize_whatsapp_web()
        if not whatsapp_driver:
            logger.critical("MAIN ERROR: WhatsApp WebDriver failed to initialize. Exiting.")
            return

        logger.info("MAIN: WhatsApp WebDriver initialized successfully")
        
        # Start file processing worker
        await file_processing_worker(whatsapp_driver)

    except Exception as e:
        logger.critical(f"MAIN CRITICAL ERROR: {e}", exc_info=True)
    finally:
        if whatsapp_driver:
            logger.info("MAIN: Closing WhatsApp WebDriver...")
            whatsapp_driver.quit()
        logger.info("MAIN: Script terminated.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nMAIN: Process interrupted by user.")
    finally:
        logging.shutdown()