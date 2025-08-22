<?php
/**
 * Environment configuration loader
 * Loads configuration from .env file or environment variables
 */

class Env {
    private static $variables = [];
    private static $loaded = false;
    
    /**
     * Load environment variables from .env file
     */
    public static function load($path = null) {
        if (self::$loaded) {
            return;
        }
        
        // Default path
        if (!$path) {
            $path = dirname(__DIR__) . '/.env';
        }
        
        // Load from .env file if exists
        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                // Skip comments
                if (strpos(trim($line), '#') === 0) {
                    continue;
                }
                
                // Parse key=value
                $parts = explode('=', $line, 2);
                if (count($parts) == 2) {
                    $key = trim($parts[0]);
                    $value = trim($parts[1]);
                    
                    // Remove quotes if present
                    $value = trim($value, '"\'');
                    
                    self::$variables[$key] = $value;
                    
                    // Also set as environment variable if not exists
                    if (!getenv($key)) {
                        putenv("$key=$value");
                    }
                }
            }
        }
        
        self::$loaded = true;
    }
    
    /**
     * Get environment variable
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get($key, $default = null) {
        if (!self::$loaded) {
            self::load();
        }
        
        // Check in order: $_ENV, getenv(), loaded variables
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        
        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }
        
        if (isset(self::$variables[$key])) {
            return self::$variables[$key];
        }
        
        return $default;
    }
    
    /**
     * Check if environment variable exists
     * 
     * @param string $key
     * @return bool
     */
    public static function has($key) {
        return self::get($key) !== null;
    }
}
?>