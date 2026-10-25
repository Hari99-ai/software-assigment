import json
import unittest
from unittest.mock import patch
import worker

PRODUCT = dict(zip(worker.HEADERS, ['WP001','AquaPure Test','water-purifiers','Demo purifier','8L tank','5000','','pending','2026-01-01','','','','']))

class Sheet:
    def __init__(self): self.saved=[]
    def rows(self): return [dict(PRODUCT)]
    def update(self, row): self.saved.append(dict(row))

class PublisherTests(unittest.TestCase):
    def setUp(self): self.journal=worker.Journal(':memory:');self.sheet=Sheet()
    def tearDown(self): self.journal.db.close()
    def test_validates_price_and_date(self):
        for changes in ({'price':'nan'},{'price':'-1'},{'features':''},{'scheduled_date':'tomorrow'}):
            with self.assertRaises(ValueError): worker.validate_product({**PRODUCT,**changes})
    def test_skips_published_and_future_rows(self):
        self.assertIsNone(worker.eligible([{**PRODUCT,'publication_status':'published'}],'2026-02-01',self.journal))
        self.assertIsNone(worker.eligible([PRODUCT],'2025-01-01',self.journal))
    def test_duplicate_ids_rejected(self):
        with self.assertRaises(ValueError): worker.eligible([PRODUCT,PRODUCT],'2026-02-01',self.journal)
    @patch('worker.poll_container')
    @patch('worker.required',return_value='ig-user')
    @patch('worker.upload_image',return_value='https://res.cloudinary.com/demo/product.jpg')
    @patch('worker.generate_image',return_value=b'image')
    @patch('worker.generate_caption',return_value='AquaPure Test #Water')
    def test_publication_is_not_repeated_after_sheet_write_failure(self,*_mocks):
        def graph(method,path,**_kwargs):
            if path.endswith('/media'): return {'id':'container'}
            if path.endswith('/media_publish'): return {'id':'media'}
            return {'permalink':'https://instagram.com/p/test/'}
        with patch('worker.graph',side_effect=graph) as provider, patch.object(self.sheet,'update',side_effect=RuntimeError('sheet down')):
            with self.assertRaises(RuntimeError): worker.execute(self.journal,self.sheet,'2026-02-01')
            self.assertEqual(self.journal.find(product_id='WP001')['state'],'published')
            worker.execute(self.journal,Sheet(),'2026-02-01')
            self.assertEqual(sum(c.args[1].endswith('/media_publish') for c in provider.call_args_list),1)
    def test_uncertain_publish_never_retried(self):
        self.journal.save('WP001','2026-02-01','publishing',PRODUCT)
        with patch('worker.graph') as api:
            with self.assertRaisesRegex(RuntimeError,'uncertain'): worker.execute(self.journal,self.sheet,'2026-02-01')
            api.assert_not_called()
    def test_previous_day_failure_is_resumed(self):
        self.journal.save('WP001','2026-01-31','selected',PRODUCT)
        with patch('worker.generate_caption',side_effect=RuntimeError('quota')):
            with self.assertRaises(RuntimeError): worker.execute(self.journal,self.sheet,'2026-02-01')
        self.assertEqual(self.journal.db.execute('SELECT COUNT(*) FROM jobs').fetchone()[0],1)
    def test_expired_unpublished_container_is_cleared_for_automatic_retry(self):
        product={**PRODUCT,'container_id':'expired','generated_caption':'AquaPure Test ₹5000 #Water','generated_image_url':'https://res.cloudinary.com/demo/product.jpg'}
        self.journal.save('WP001','2026-02-01','container_created',product)
        with patch('worker.poll_container',side_effect=worker.ContainerExpired('expired')):
            with self.assertRaises(worker.ContainerExpired): worker.execute(self.journal,self.sheet,'2026-02-01')
        job=self.journal.find(product_id='WP001')
        self.assertEqual(job['state'],'prepared')
        self.assertNotIn('container_id',json.loads(job['payload']))

if __name__ == '__main__': unittest.main()
