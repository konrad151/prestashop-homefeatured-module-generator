$( document ).ready(function() {
    $("form").submit(function(event) {
    
        var val1 = $.trim($('input.tabname').val()).length;
        var val2 = $.trim($('input.name').val()).length;
        if (val1 > 0 && val2 > 0) {
        
        var modulename = $('.name').val();
        var tabname = $('.tabname').val();
        var phpExtension = ".php";
        var cssExtension = ".css";
        var zipExtension = ".zip";
        var tplExtension = ".tpl";
        
        var zip = new JSZip();
        var moduleNameCatalog = zip.folder(modulename);
        var css = moduleNameCatalog.folder("css");
        var img = moduleNameCatalog.folder("img");
        var translations = moduleNameCatalog.folder("translations");
        var upgrade = moduleNameCatalog.folder("upgrade");
        var views = moduleNameCatalog.folder("views");
        var templates = views.folder("templates");
        var hook = templates.folder("hook");
        moduleNameCatalog.file("CHANGELOG.txt", `2014-04-22 18:58:43 +0200	// Changelog updated
2014-04-07 18:48:47 +0200	// typo
2014-04-07 18:46:31 +0200	[-] FO : Fix css bug #PSCFV-11485 for 1.5
2014-03-20 14:35:19 +0100	Initial commit
`);
        moduleNameCatalog.file("config.xml", `<?xml version="1.0" encoding="UTF-8" ?>
<module>
	<name>`+ modulename +`</name>
	<displayName><![CDATA[`+ modulename +`]]></displayName>
	<version><![CDATA[1.8.1]]></version>
	<description><![CDATA[Displays featured products in the central column of your homepage.]]></description>
	<author><![CDATA[PrestaShop]]></author>
	<tab><![CDATA[front_office_features]]></tab>
	<is_configurable>1</is_configurable>
	<need_instance>0</need_instance>
	<limited_countries></limited_countries>
</module>
`);
        moduleNameCatalog.file(modulename + phpExtension, `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

if (!defined('_PS_VERSION_'))
	exit;

class `+ modulename +` extends Module
{
	protected static $cache_products;

	public function __construct()
	{
		$this->name = '`+ modulename +`';
		$this->tab = 'front_office_features';
		$this->version = '1.8.1';
		$this->author = 'PrestaShop';
		$this->need_instance = 0;

		$this->bootstrap = true;
		parent::__construct();

		$this->displayName = $this->l('Featured products on the homepage');
		$this->description = $this->l('Displays featured products in the central column of your homepage.');
		$this->ps_versions_compliancy = array('min' => '1.6', 'max' => '1.6.99.99');
	}

	public function install()
	{
		$this->_clearCache('*');
		Configuration::updateValue('`+ modulename +`_NBR', 8);
		Configuration::updateValue('`+ modulename +`_CAT', (int)Context::getContext()->shop->getCategory());
		Configuration::updateValue('HOME_FEATURED_RANDOMIZE', false);

		if (!parent::install()
			|| !$this->registerHook('header')
			|| !$this->registerHook('addproduct')
			|| !$this->registerHook('updateproduct')
			|| !$this->registerHook('deleteproduct')
			|| !$this->registerHook('categoryUpdate')
			|| !$this->registerHook('displayHomeTab')
			|| !$this->registerHook('displayHomeTabContent')
		)
			return false;

		return true;
	}

	public function uninstall()
	{
		$this->_clearCache('*');

		return parent::uninstall();
	}

	public function getContent()
	{
		$output = '';
		$errors = array();
		if (Tools::isSubmit('submit`+ modulename +`'))
		{
			$nbr = Tools::getValue('`+ modulename +`_NBR');
			if (!Validate::isInt($nbr) || $nbr <= 0)
			$errors[] = $this->l('The number of products is invalid. Please enter a positive number.');

			$cat = Tools::getValue('`+ modulename +`_CAT');
			if (!Validate::isInt($cat) || $cat <= 0)
				$errors[] = $this->l('The category ID is invalid. Please choose an existing category ID.');

			$rand = Tools::getValue('HOME_FEATURED_RANDOMIZE');
			if (!Validate::isBool($rand))
				$errors[] = $this->l('Invalid value for the "randomize" flag.');
			if (isset($errors) && count($errors))
				$output = $this->displayError(implode('<br />', $errors));
			else
			{
				Configuration::updateValue('`+ modulename +`_NBR', (int)$nbr);
				Configuration::updateValue('`+ modulename +`_CAT', (int)$cat);
				Configuration::updateValue('HOME_FEATURED_RANDOMIZE', (bool)$rand);
				Tools::clearCache(Context::getContext()->smarty, $this->getTemplatePath('`+ modulename+`.tpl'));
				$output = $this->displayConfirmation($this->l('Your settings have been updated.'));
			}
		}

		return $output.$this->renderForm();
	}

	public function hookDisplayHeader($params)
	{
		$this->hookHeader($params);
	}

	public function hookHeader($params)
	{
		if (isset($this->context->controller->php_self) && $this->context->controller->php_self == 'index')
			$this->context->controller->addCSS(_THEME_CSS_DIR_.'product_list.css');
		$this->context->controller->addCSS(($this->_path).'css/`+ modulename +`.css', 'all');
	}

	public function _cacheProducts()
	{
		if (!isset(`+ modulename +`::$cache_products))
		{
			$category = new Category((int)Configuration::get('`+ modulename +`_CAT'), (int)Context::getContext()->language->id);
			$nb = (int)Configuration::get('`+ modulename +`_NBR');
			if (Configuration::get('HOME_FEATURED_RANDOMIZE'))
				`+ modulename +`::$cache_products = $category->getProducts((int)Context::getContext()->language->id, 1, ($nb ? $nb : 8), null, null, false, true, true, ($nb ? $nb : 8));
			else
				`+ modulename +`::$cache_products = $category->getProducts((int)Context::getContext()->language->id, 1, ($nb ? $nb : 8), 'position');
		}

		if (`+ modulename +`::$cache_products === false || empty(`+ modulename +`::$cache_products))
			return false;
	}

	public function hookDisplayHomeTab($params)
	{
		if (!$this->isCached('tab.tpl', $this->getCacheId('`+ modulename +`-tab')))
			$this->_cacheProducts();

		return $this->display(__FILE__, 'tab.tpl', $this->getCacheId('`+ modulename +`-tab'));
	}

	public function hookDisplayHome($params)
	{
		if (!$this->isCached('`+ modulename+`.tpl', $this->getCacheId()))
		{
			$this->_cacheProducts();
			$this->smarty->assign(
				array(
					'products' => `+ modulename +`::$cache_products,
					'add_prod_display' => Configuration::get('PS_ATTRIBUTE_CATEGORY_DISPLAY'),
					'homeSize' => Image::getSize(ImageType::getFormatedName('home')),
				)
			);
		}

		return $this->display(__FILE__, '`+ modulename+`firen.tpl', $this->getCacheId());
	}

	public function hookDisplayHomeTabContent($params)
	{
		return $this->hookDisplayHome($params);
	}

	public function hookAddProduct($params)
	{
		$this->_clearCache('*');
	}

	public function hookUpdateProduct($params)
	{
		$this->_clearCache('*');
	}

	public function hookDeleteProduct($params)
	{
		$this->_clearCache('*');
	}

	public function hookCategoryUpdate($params)
	{
		$this->_clearCache('*');
	}

	public function _clearCache($template, $cache_id = NULL, $compile_id = NULL)
	{
		parent::_clearCache('`+ modulename+`.tpl');
		parent::_clearCache('tab.tpl', '`+ modulename +`-tab');
	}

	public function renderForm()
	{
		$fields_form = array(
			'form' => array(
				'legend' => array(
					'title' => $this->l('Settings'),
					'icon' => 'icon-cogs'
				),
				'description' => $this->l('To add products to your homepage, simply add them to the corresponding product category (default: "Home").'),
				'input' => array(
					array(
						'type' => 'text',
						'label' => $this->l('Number of products to be displayed'),
						'name' => '`+ modulename +`_NBR',
						'class' => 'fixed-width-xs',
						'desc' => $this->l('Set the number of products that you would like to display on homepage (default: 8).'),
					),
					array(
						'type' => 'text',
						'label' => $this->l('Category from which to pick products to be displayed'),
						'name' => '`+ modulename +`_CAT',
						'class' => 'fixed-width-xs',
						'desc' => $this->l('Choose the category ID of the products that you would like to display on homepage (default: 2 for "Home").'),
					),
					array(
						'type' => 'switch',
						'label' => $this->l('Randomly display featured products'),
						'name' => 'HOME_FEATURED_RANDOMIZE',
						'class' => 'fixed-width-xs',
						'desc' => $this->l('Enable if you wish the products to be displayed randomly (default: no).'),
						'values' => array(
							array(
								'id' => 'active_on',
								'value' => 1,
								'label' => $this->l('Yes')
							),
							array(
								'id' => 'active_off',
								'value' => 0,
								'label' => $this->l('No')
							)
						),
					),
				),
				'submit' => array(
					'title' => $this->l('Save'),
				)
			),
		);

		$helper = new HelperForm();
		$helper->show_toolbar = false;
		$helper->table = $this->table;
		$lang = new Language((int)Configuration::get('PS_LANG_DEFAULT'));
		$helper->default_form_language = $lang->id;
		$helper->allow_employee_form_lang = Configuration::get('PS_BO_ALLOW_EMPLOYEE_FORM_LANG') ? Configuration::get('PS_BO_ALLOW_EMPLOYEE_FORM_LANG') : 0;
		$this->fields_form = array();
		$helper->id = (int)Tools::getValue('id_carrier');
		$helper->identifier = $this->identifier;
		$helper->submit_action = 'submit`+ modulename +`';
		$helper->currentIndex = $this->context->link->getAdminLink('AdminModules', false).'&configure='.$this->name.'&tab_module='.$this->tab.'&module_name='.$this->name;
		$helper->token = Tools::getAdminTokenLite('AdminModules');
		$helper->tpl_vars = array(
			'fields_value' => $this->getConfigFieldsValues(),
			'languages' => $this->context->controller->getLanguages(),
			'id_language' => $this->context->language->id
		);

		return $helper->generateForm(array($fields_form));
	}

	public function getConfigFieldsValues()
	{
		return array(
			'`+ modulename +`_NBR' => Tools::getValue('`+ modulename +`_NBR', (int)Configuration::get('`+ modulename +`_NBR')),
			'`+ modulename +`_CAT' => Tools::getValue('`+ modulename +`_CAT', (int)Configuration::get('`+ modulename +`_CAT')),
			'HOME_FEATURED_RANDOMIZE' => Tools::getValue('HOME_FEATURED_RANDOMIZE', (bool)Configuration::get('HOME_FEATURED_RANDOMIZE')),
		);
	}
}
`);

        
        moduleNameCatalog.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);
        
        
        moduleNameCatalog.file("logo.gif", `R0lGODlhEAAQAOYAADd1Mqurq7Z2NHt7e1eNUYBKLLCLW+/v74K5e3Nzc9zb2aWlpb6IQlp0WGyzYczMzNKpb2ZmZpmZmZ5vQ8HXv4uLi3k/JqPAobB/QuDe3NnIwcekdl2dVvb29rqMVI1gTXy+ca1/TJZqVbyZakl3ReTz4o7Kg5BcOLiEO+rbx2WbYYSEhKfWoM+rfOXl5bp+QmGQXcWUUvfw6bGDT5NjO5SUlNXU0sfjw6F0RsGKR7h6OXGtaU2FR2GuWKJvPbOCQD56OdClacKcZqPHn7qEOsCHRrp9O5SMjNOsdb2UUtOueePh38KMSlqJWF58W12jVJRaOuzcx72EQmOUY3K4aaV1PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEHAB0ALAAAAAAQABAAAAeygB2Cgx0yMoSIhC8COkWJiDo5QUExDI+CRkwQm0qVj5kQMUREMS0eGIhGMUiVNjY/HhszPoNSMZ1SDwcHClUhIzgnHUK3Mbm7uwo0EwY0IlGkPxnIyEsFJxYaHSlCRx0HCeEJBx0VH9qDNbsJEhID5AkuiBW7A+0r8PIdJTcIBBcHBixYgI9Fjx1DKFChAsIBDBcrAgSosASECRBPACDgoIJEgwErKoiM4ISHCiBNLl0KBAA7`, {base64: true});
        
        moduleNameCatalog.file("logo.png", `iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFlUlEQVRYw7WXXYxVVxXHf2vtc+4M1IaJopVhgFZSxOFDiqUfNBSVaiNUgw9KjNHURu2DlWhRU2NsJelLjRI0mijWSHwx8aH2hcaqNJVKiIkJhraoBUGbZmYQTXGce+eej72WD+fMx51vJnQnN/fk3r2zfnv919cRpq/k7QePPT0aZU9pjnNtlwCJCkuCHxt6bM/emfZcv+zRZ/yNXssefcaB65MZALoLq+590/dfZkkQVK/N7c1gNDoX92+gttGdzOIlANYs6+a6VFCRawPgTrPoEFVmAsC92vTmpQ26gqCyOK2ncptDd+odNmYGqL+f+tgq3uiVzPXnS2dexEWQq5BAgIbAty+mNHSSnrUEhTk/+fD6+QCqYyFJEVU0KAtB8NrPDXXe1BVYEkAn6RfNaRexNiHzeyCEgAbl1F+GEJE5IbzWdXv/CoI4XYny2vlBVKtzDkQzet9xQ4fOcwOoIqLs2Ni3oEA0B9wIKgSEdetXEiadi+aMjnlgbgkqPE0qAA2KdiToHJHrgoiTqpNqZwYJkE65yfweUOUPLw3WxWhuAjPYsakXFSdR58K5QcKUGFg9JgE+P4CGABrYuWU1IpPNOzM1CasSvAKQSP/6lR0eiOZk5QIk8LEsSLuRtBtBwHIEqwLKHbNYFZvpVQwVSNRIpkogEE3nB8ilC4DG0h5OfW05IsJdh17n5O+f4+/nz7H2xjXccedtPP/nV+tsknEJ7t7Ui0ql9blXBlAFQXCcGJ21N69YgAeSHgBOHFhO3/aPIyKceHg5F979Pe7ZtYvfPvsbduzYzvu3rAb3aak4BrC5vzN7zJ2ssFkBkl8/suVXXRrv09F9PPWFFr3b9rLt/iMA/LHIKU9/Gd91muhCCAluVgHIRFiMASQIqUhHPzDAZPYsWBJF77v59ht44fgF+m7ZzR2fOQytVwHh9gd+wMknnbOHtlKue5wk7eK50/9E3EAqDnfYuXklqpAG4ezfBqo6INWGaM471/XOCtDdjsbx4/9g1cb3ctsnDuIjA/QfvAw4Z7/VZtsnn6AA2n/6Otr4HLtuXYuX+XhnqyAMFSGIcMuGlR2t3MzJ4+wSyHC7Td/Gu9m696uMDl/GyPjrK5cByJpdZLR5z0e/QV4aP72/h88evUKeSQ1hOKCqiAqJgDrIpBhRKmlmAmg8uf9dl1b038XW3V8kb/4XRCFt0P7ZWgDahZEXBWQZt37kK5TR+OGne3jo51fIgVgWiFQJrCok9Uc6M7SimALQOPKlTVlYtop7HzzC0PlTiCZcfPYw/3n5dxNThTtv2XAPN927n9geYfdDR/nxI+/jO/u6OPCLDHHDvaoTYQ6AqZ09AdLPH35x89NHP3Umb75OLHK0kTBw5jh7HvslrksrfazFsYP7WPPB/ViRkzWv0HPjTh584gXK6FW3FK09oCTKzAA+HaAAmrEcpchGKC2SuJFLIBseYuDUIQB673yYXALmRmmRPPsfsWjXTcbrvl8bVCVBCBO/1HXCkRliIAdGzEqyrInHiEWjdKVoXUJCA4CidYnSFYuGx0jebuFe1XVRoe6XNYBMaC4+rWFOfp7IAjfKdhOLhsRIQaAcGUTqubUcGaQgYGOA7eZE2xaBEDputnvDW+cd3Zgckw7kWQtzw63yQDkyBKqg1XPpipthbhR5i0QXP66nQafWASFvj+LmuBk5QtkaGi8kZWuIHMHNcHOKrE1XmiLfPIF6m8RLZAEvciqV8e7syslh8HGAkKRV/0fQoHgIBCmRVOqDJV7PiNVeRRtL4fGdHzIo8qu4/SiUw/BvoC1A40cHPpCZlViMuDuiAdEUR8ebXTWQGG4FbhERIYRAlzoPfPf5VXUwL3Q50AZGBbgO6APeBjSuUsoc+BfwGtBc7Ntyo4ZIFxlPRW08X8zh/wNZKNz7WkS3DAAAAABJRU5ErkJggg==`, {base64: true});    

/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------CSS FILES START---------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
css.file(modulename + cssExtension, `#featured-products_block_center li {
	margin-right:10px;
	padding:10px 0;
	width:126px;
	height:240px
}
#featured-products_block_center li.last_item_of_line  {margin-right:0;}
#featured-products_block_center .s_title_block,  #featured-products_block_center h5 {
	padding-top:5px;
	height:30px;
	min-height:30px;
	max-height:30px;
	overflow: hidden;
	font-size:12px;
	color:#222;
	padding-bottom: 0;
	font-weight:bold;
}

#featured-products_block_center .product_image {
	display:block;
	position:relative;
	overflow:hidden
}
#featured-products_block_center .product_image span.new {
	display: block;
	position: absolute;
	top: 15px;
	right:-30px;
	padding: 1px 4px;
	width: 101px;
	font-size:10px;
	color: #fff;
	text-align: center;
	text-transform: uppercase;
	-moz-transform: rotate(45deg);
	-webkit-transform: rotate(45deg);
	-o-transform:rotate(45deg);
	-ms-transform: rotate(45deg);
	background-color: #990000;
	transform: rotate(45deg);  /* Newer browsers */
}

#featured-products_block_center .product_desc {
	height: 45px;
	min-height:45px;
	max-height: 45px;
	overflow: hidden;
}
#featured-products_block_center .product_desc,
#featured-products_block_center .product_desc a {
	color:#666
}
#featured-products_block_center .lnk_more {
	display:inline;
	padding-right:10px;
	font-weight:bold;
	font-size:10px;
	color:#0088cc;
	background:url(../img/arrow_right_1.png) no-repeat 100% 3px;
}
#featured-products_block_center .price_container {
	margin-top:10px;
	padding:0;
}
#featured-products_block_center .price {
	font-weight:bold;
	font-size:14px;
	color:#990000
}
#featured-products_block_center li .ajax_add_to_cart_button {display:none;}
#featured-products_block_center li span.exclusive {display:none;}

`);  

css.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);   
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------CSS FILES END-----------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
        
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------IMG FILES START---------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
        img.file("arrow_right_1.png", `iVBORw0KGgoAAAANSUhEUgAAAAQAAAAHCAYAAAAvZezQAAAAJElEQVQI12Ng6DjzHwgYYJgBJIAsCBeACaIIgDFOFShmINsCANkHSQ11GLosAAAAAElFTkSuQmCC`, {base64: true}); 

        
img.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);    
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------IMG FILES END-----------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
        
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------TRANSLATIONS FILES START------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/

translations.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);

        
translations.file("pl.php", `<?php

global $_MODULE;
$_MODULE = array();

$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_5d17bf499a1b9b2e816c99eebf0153a9'] = '`+ tabname +`';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_6d37ec35b5b6820f90394e5ee49e8cec'] = 'Wyświetla polecane produkty w środkowej kolumnie strony głównej.';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_fddb8a1881e39ad11bfe0d0aca5becc3'] = 'Liczba produktów jest niewłaściwa. Proszę wprowadzić prawidłową liczbę.';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_c284a59996a4e984b30319999a7feb1d'] = 'ID kategorii jest nieprawidłowe. Proszę wybrać istniejącą kategorię.';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_fd2608d329d90e9a49731393427d0a5a'] = 'Nieprawidłowa wartość dla ustawienia "losowego".';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_6af91e35dff67a43ace060d1d57d5d1a'] = 'Zaktualizowano ustawienia';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_f4f70727dc34561dfde1a3c529b6205c'] = 'Ustawienia';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_abc877135a96e04fc076becb9ce6fdfa'] = 'Aby dodać produkty do swojej strony głównej, po prostu dodaj je do odpowiedniej kategorii produktów (domyślnie: "Home").';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_d44168e17d91bac89aab3f38d8a4da8e'] = 'Ilość produktów, które mają być wyświetlane';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_1b73f6b70a0fcd38bbc6a6e4b67e3010'] = 'Ustaw ilość produktów, które chcesz wyświetlić na stronie głównej (domyślnie: 8).';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_b773a38d8c456f7b24506c0e3cd67889'] = 'Kategoria z której będą pobrane produkty do wyświetlania';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_0db2d53545e2ee088cfb3f45e618ba68'] = 'Wybierz identyfikator kategorii produktów, które chcesz wyświetlić na stronie głównej (domyślnie: 2 dla "Home").';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_49417670345173e7b95018b7bf976fc7'] = 'Losowe wyświetlanie produktów polecanych';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_3c12c1068fb0e02fe65a6c4fc40bc29a'] = 'Włącz, jeśli chcesz aby produkty były wyświetlane losowo (domyślnie: nie).';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_93cba07454f06a4a960172bbd6e2a435'] = 'Tak';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_bafd7322c6e97d25b6299b5d6fe8920b'] = 'Nie';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_c9cc8cce247e49bae79f15173ce97354'] = 'Zapisz';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_ca7d973c26c57b69e0857e7a0332d545'] = 'Produkty polecane';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_03c2e7e41ffc181a4e84080b4710e81e'] = 'Nowy';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_d3da97e2d9aee5c8fbe03156ad051c99'] = 'Więcej';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_4351cfebe4b61d8aa5efa1d020710005'] = 'Zobacz';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_2d0f6b8300be19cf35e89e66f0677f95'] = 'Dodaj do koszyka';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_e0e572ae0d8489f8bf969e93d469e89c'] = 'Brak polecanych produktów';
$_MODULE['<{`+ modulename +`}prestashop>tab_2cc1943d4c0b46bfcf503a75c44f988b'] = '`+ modulename +`';
$_MODULE['<{`+ modulename +`}prestashop>`+ modulename +`_d505d41279039b9a68b0427af27705c6'] = 'Brak polecanych produktów w tym momencie.';


return $_MODULE;
`);
        
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------TRANSLATIONS FILES END--------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------UPGRADE FILES START-----------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/ 

upgrade.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);
        
upgrade.file("install-1.1.php", `<?php

if (!defined('_PS_VERSION_'))
	exit;

function upgrade_module_1_1($object)
{
	return ($object->registerHook('addproduct') && $object->registerHook('updateproduct') && $object->registerHook('deleteproduct'));
}`);
        
upgrade.file("install-1.2.php", `<?php

if (!defined('_PS_VERSION_'))
	exit;

function upgrade_module_1_2($object)
{
	return ($object->registerHook('displayHomeTab') && $object->registerHook('displayHomeTabContent') && $object->registerHook('categoryUpdate'));
}`);
        
upgrade.file("install-1.6.php", `<?php

if (!defined('_PS_VERSION_'))
	exit;

function upgrade_module_1_6($object)
{
	return Configuration::updateValue('HOME_FEATURED_CAT', (int)Context::getContext()->shop->getCategory()) && Configuration::updateValue('HOME_FEATURED_RANDOMIZE', false);
}`);
          
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------UPGRADE FILES END-------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/ 
        
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------VIEWS FILES START-------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/  
views.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);
        
templates.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);
        
hook.file("index.php", `<?php
/*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

header('Location: ../');
exit;`);

        
hook.file(modulename + "firen" + tplExtension, `{*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*}
{if isset($products) && $products}
	{include file="$tpl_dir./product-list.tpl" class='`+ modulename +` tab-pane' id='`+ modulename +`'}
{else}
<ul id="`+ modulename +`" class="`+ modulename +` tab-pane">
	<li class="alert alert-info">{l s='No featured products at this time.' mod='`+ modulename +`'}</li>
</ul>
{/if}`);


        
        
hook.file("tab.tpl", `{*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*}
<li><a data-toggle="tab" href="#`+ modulename +`" class="`+ modulename +`">{l s='Popular' mod='`+ modulename +`'}</a></li>`);
        
hook.file(modulename + tplExtension, `{*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*}

<!-- MODULE Home Featured Products -->
<div id="featured-products_block_center" class="block products_block clearfix">
	<h4 class="title_block">{l s='Featured products' mod='`+ modulename +`'}</h4>
	{if isset($products) AND $products}
		<div class="block_content">
			{assign var='liHeight' value=250}
			{assign var='nbItemsPerLine' value=4}
			{assign var='nbLi' value=$products|@count}
			{math equation="nbLi/nbItemsPerLine" nbLi=$nbLi nbItemsPerLine=$nbItemsPerLine assign=nbLines}
			{math equation="nbLines*liHeight" nbLines=$nbLines|ceil liHeight=$liHeight assign=ulHeight}
			<ul style="height:{$ulHeight|escape:'html'}px;">
			{foreach from=$products item=product name=`+ modulename +`Products}
				{math equation="(total%perLine)" total=$smarty.foreach.`+ modulename +`Products.total perLine=$nbItemsPerLine assign=totModulo}
				{if $totModulo == 0}{assign var='totModulo' value=$nbItemsPerLine}{/if}
				<li class="ajax_block_product {if $smarty.foreach.`+ modulename +`Products.first}first_item{elseif $smarty.foreach.`+ modulename +`Products.last}last_item{else}item{/if} {if $smarty.foreach.`+ modulename +`Products.iteration%$nbItemsPerLine == 0}last_item_of_line{elseif $smarty.foreach.`+ modulename +`Products.iteration%$nbItemsPerLine == 1} {/if} {if $smarty.foreach.`+ modulename +`Products.iteration > ($smarty.foreach.`+ modulename +`Products.total - $totModulo)}last_line{/if}">
					<a href="{$product.link|escape:'html'}" title="{$product.name|escape:html:'UTF-8'}" class="product_image"><img src="{$link->getImageLink($product.link_rewrite, $product.id_image, 'home_default')|escape:'html'}" height="{$homeSize.height}" width="{$homeSize.width}" alt="{$product.name|escape:html:'UTF-8'}" />{if isset($product.new) && $product.new == 1}<span class="new">{l s='New' mod='`+ modulename +`'}</span>{/if}</a>
					<h5 class="s_title_block"><a href="{$product.link|escape:'html'}" title="{$product.name|truncate:50:'...'|escape:'html':'UTF-8'}">{$product.name|truncate:35:'...'|escape:'html':'UTF-8'}</a></h5>
					<div class="product_desc"><a href="{$product.link|escape:'html'}" title="{l s='More' mod='`+ modulename +`'}">{$product.description_short|strip_tags|truncate:65:'...'}</a></div>
					<div>
						<a class="lnk_more" href="{$product.link|escape:'html'}" title="{l s='View' mod='`+ modulename +`'}">{l s='View' mod='`+ modulename +`'}</a>
						{if $product.show_price AND !isset($restricted_country_mode) AND !$PS_CATALOG_MODE}<p class="price_container"><span class="price">{if !$priceDisplay}{convertPrice price=$product.price}{else}{convertPrice price=$product.price_tax_exc}{/if}</span></p>{else}<div style="height:21px;"></div>{/if}
						
						{if ($product.id_product_attribute == 0 OR (isset($add_prod_display) AND ($add_prod_display == 1))) AND $product.available_for_order AND !isset($restricted_country_mode) AND $product.minimal_quantity == 1 AND $product.customizable != 2 AND !$PS_CATALOG_MODE}
							{if ($product.quantity > 0 OR $product.allow_oosp)}
							<a class="exclusive ajax_add_to_cart_button" rel="ajax_id_product_{$product.id_product}" href="{$link->getPageLink('cart')|escape:'html'}?qty=1&amp;id_product={$product.id_product}&amp;token={$static_token}&amp;add" title="{l s='Add to cart' mod='`+ modulename +`'}">{l s='Add to cart' mod='`+ modulename +`'}</a>
							{else}
							<span class="exclusive">{l s='Add to cart' mod='`+ modulename +`'}</span>
							{/if}
						{else}
							<div style="height:23px;"></div>
						{/if}
					</div>
				</li>
			{/foreach}
			</ul>
		</div>
	{else}
		<p>{l s='No featured products' mod='`+ modulename +`'}</p>
	{/if}
</div>
<!-- /MODULE Home Featured Products -->
`);
        
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------VIEWS FILES END---------------------------------*/
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
        
        
        

        
        
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            // see FileSaver.js
            saveAs(content, modulename + zipExtension);
            
        });
        }else{
            event.preventDefault();
            /*alert("Type tab and module name")*/
                  
                  sweetAlert("Oops...", "Type tab and module name to download your module", "error");
        };
    });
});